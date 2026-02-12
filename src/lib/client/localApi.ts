import {
  DEFAULT_LOCKED_CORE,
  DEFAULT_QC_THRESHOLD,
  DEFAULT_STORE_DATA,
  DEFAULT_VARIANT_COUNT,
} from "@/lib/domain/defaults";
import { generateRunSchema, markBestSchema, updateQcSchema } from "@/lib/domain/schemas";
import type {
  LockedCore,
  Run,
  SceneCard,
  StoreData,
  Technique,
  Variant,
} from "@/lib/domain/types";
import { buildExportRows, rowsToCsv } from "@/lib/api/export";
import { generateVariants } from "@/lib/prompt/generateVariants";
import { scoreQc, statusFromScore } from "@/lib/qc/scoreQc";

const LOCAL_STORE_KEY = "prompt-copilot/local-store/v1";
const FORCE_LOCAL_MODE = process.env.NEXT_PUBLIC_FORCE_LOCAL_MODE === "true";

function makeClientId(prefix: string): string {
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : `${Date.now()}${Math.random().toString(16).slice(2, 10)}`;
  return `${prefix}_${token}`;
}

function readLocalStore(): StoreData {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_STORE_DATA);
    }

    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      version: 1,
      locked_core: parsed.locked_core ?? DEFAULT_LOCKED_CORE,
      scenes: parsed.scenes ?? [],
      techniques: parsed.techniques ?? [],
      runs: parsed.runs ?? [],
      variants: parsed.variants ?? [],
    };
  } catch {
    return structuredClone(DEFAULT_STORE_DATA);
  }
}

function writeLocalStore(store: StoreData): void {
  localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
}

function parseBody(init?: RequestInit): unknown {
  const payload = init?.body;
  if (!payload) {
    return undefined;
  }

  if (typeof payload === "string") {
    return JSON.parse(payload);
  }

  throw new Error("Unsupported request body in local API mode");
}

function findRunDependencies(store: StoreData, run: Run): {
  scene: SceneCard;
  technique: Technique;
  variants: Variant[];
} {
  const scene = store.scenes.find((item) => item.id === run.scene_id);
  const technique = store.techniques.find((item) => item.id === run.technique_id);

  if (!scene || !technique) {
    throw new Error("Run dependencies not found");
  }

  const variants = store.variants.filter((item) => item.run_id === run.id);
  return { scene, technique, variants };
}

function normalizePath(path: string): URL {
  return new URL(path, "http://local");
}

export function shouldUseLocalApiRuntime(): boolean {
  if (FORCE_LOCAL_MODE) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname.endsWith("github.io");
}

export async function localApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = normalizePath(path);
  const method = (init?.method ?? "GET").toUpperCase();
  const body = parseBody(init);

  const store = readLocalStore();

  if (url.pathname === "/api/locked-core" && method === "GET") {
    return store.locked_core as T;
  }

  if (url.pathname === "/api/locked-core" && method === "PUT") {
    const payload = body as LockedCore;
    store.locked_core = payload;
    writeLocalStore(store);
    return store.locked_core as T;
  }

  if (url.pathname === "/api/scenes" && method === "GET") {
    return store.scenes as T;
  }

  if (url.pathname === "/api/scenes" && method === "POST") {
    const payload = body as Omit<SceneCard, "id">;
    const scene: SceneCard = {
      id: makeClientId("scene"),
      ...payload,
    };
    store.scenes.push(scene);
    writeLocalStore(store);
    return scene as T;
  }

  if (url.pathname === "/api/techniques" && method === "GET") {
    return store.techniques as T;
  }

  if (url.pathname === "/api/techniques" && method === "POST") {
    const payload = body as Omit<Technique, "id">;
    const technique: Technique = {
      id: makeClientId("tech"),
      ...payload,
    };
    store.techniques.push(technique);
    writeLocalStore(store);
    return technique as T;
  }

  if (url.pathname === "/api/runs" && method === "GET") {
    const runs = store.runs
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((run) => {
        const scene = store.scenes.find((item) => item.id === run.scene_id);
        const technique = store.techniques.find((item) => item.id === run.technique_id);
        const variants = store.variants.filter((variant) => variant.run_id === run.id);
        const passCount = variants.filter((variant) => variant.status === "pass" || variant.status === "best").length;

        return {
          ...run,
          scene_title: scene?.title ?? "Unknown scene",
          technique_name: technique?.name ?? "Unknown technique",
          pass_count: passCount,
        };
      });

    return runs as T;
  }

  if (url.pathname === "/api/runs/generate" && method === "POST") {
    const parsed = generateRunSchema.parse(body);
    const scene = store.scenes.find((item) => item.id === parsed.scene_id);
    const technique = store.techniques.find((item) => item.id === parsed.technique_id);

    if (!scene) {
      throw new Error("Scene not found");
    }

    if (!technique) {
      throw new Error("Technique not found");
    }

    const runId = makeClientId("run");
    const run: Run = {
      id: runId,
      scene_id: scene.id,
      technique_id: technique.id,
      variant_count: parsed.variant_count ?? DEFAULT_VARIANT_COUNT,
      created_at: new Date().toISOString(),
      best_variant_id: null,
      pass_threshold: parsed.pass_threshold ?? DEFAULT_QC_THRESHOLD,
    };

    const variants = generateVariants({
      runId,
      variantCount: run.variant_count,
      lockedCore: store.locked_core,
      scene,
      technique,
      baseSeed: parsed.base_seed,
    });

    store.runs.push(run);
    store.variants.push(...variants);
    writeLocalStore(store);

    return { run, variants } as T;
  }

  const runMatch = url.pathname.match(/^\/api\/runs\/([^/]+)$/);
  if (runMatch && method === "GET") {
    const runId = runMatch[1];
    const run = store.runs.find((item) => item.id === runId);

    if (!run) {
      throw new Error("Run not found");
    }

    const scene = store.scenes.find((item) => item.id === run.scene_id) ?? null;
    const technique = store.techniques.find((item) => item.id === run.technique_id) ?? null;
    const variants = store.variants.filter((item) => item.run_id === run.id);

    return { run, scene, technique, variants } as T;
  }

  const qcMatch = url.pathname.match(/^\/api\/variants\/([^/]+)\/qc$/);
  if (qcMatch && method === "PATCH") {
    const variantId = qcMatch[1];
    const parsed = updateQcSchema.parse(body);

    const variant = store.variants.find((item) => item.id === variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }

    const run = store.runs.find((item) => item.id === variant.run_id);
    if (!run) {
      throw new Error("Run not found");
    }

    if (parsed.threshold !== undefined) {
      run.pass_threshold = parsed.threshold;
    }

    const result = scoreQc(parsed.qc_breakdown, run.pass_threshold);
    variant.qc_breakdown = parsed.qc_breakdown;
    variant.qc_score = result.score;

    if (run.best_variant_id === variant.id) {
      variant.status = "best";
    } else {
      variant.status = result.status;
    }

    if (parsed.threshold !== undefined) {
      for (const item of store.variants) {
        if (item.run_id !== run.id || item.id === run.best_variant_id) {
          continue;
        }

        item.status = statusFromScore(item.qc_score, run.pass_threshold);
      }
    }

    writeLocalStore(store);
    return { variant, run } as T;
  }

  const bestMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/best$/);
  if (bestMatch && method === "PATCH") {
    const runId = bestMatch[1];
    const parsed = markBestSchema.parse(body);

    const run = store.runs.find((item) => item.id === runId);
    if (!run) {
      throw new Error("Run not found");
    }

    const newBest = store.variants.find((variant) => variant.id === parsed.variant_id);
    if (!newBest || newBest.run_id !== runId) {
      throw new Error("Variant not found in run");
    }

    if (run.best_variant_id) {
      const previousBest = store.variants.find((variant) => variant.id === run.best_variant_id);
      if (previousBest) {
        previousBest.status = statusFromScore(previousBest.qc_score, run.pass_threshold);
      }
    }

    run.best_variant_id = newBest.id;
    newBest.status = "best";

    writeLocalStore(store);
    return { run, best_variant: newBest } as T;
  }

  const exportMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/export$/);
  if (exportMatch && method === "GET") {
    const runId = exportMatch[1];
    const run = store.runs.find((item) => item.id === runId);

    if (!run) {
      throw new Error("Run not found");
    }

    const { scene, technique, variants } = findRunDependencies(store, run);
    const rows = buildExportRows(run, scene, technique, variants);
    const format = url.searchParams.get("format") ?? "json";

    if (format === "csv") {
      return rowsToCsv(rows) as T;
    }

    return { run, scene, technique, variants, rows } as T;
  }

  throw new Error(`Unsupported local API endpoint: ${method} ${url.pathname}`);
}
