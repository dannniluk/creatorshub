"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { localApiRequest, shouldUseLocalApiRuntime } from "@/lib/client/localApi";
import { DEFAULT_LOCKED_CORE, DEFAULT_QC_THRESHOLD, DEFAULT_VARIANT_COUNT } from "@/lib/domain/defaults";
import type {
  LockedCore,
  QcBreakdown,
  Run,
  SceneCard,
  Technique,
  Variant,
} from "@/lib/domain/types";

type ApiEnvelope<T> = {
  data: T;
  error?: string;
};

type RunSummary = Run & {
  scene_title: string;
  technique_name: string;
  pass_count: number;
};

type RunDetails = {
  run: Run;
  scene: SceneCard | null;
  technique: Technique | null;
  variants: Variant[];
};

type SceneDraft = Omit<SceneCard, "id">;
type TechniqueDraft = Omit<Technique, "id">;

const STORAGE_KEYS = {
  lockedCore: "prompt-copilot/locked-core-draft",
  generator: "prompt-copilot/generator-settings",
};

const EMPTY_SCENE: SceneDraft = {
  title: "",
  goal: "",
  action: "",
  environment: "",
  lighting: "",
  duration_hint: "",
};

const EMPTY_TECHNIQUE: TechniqueDraft = {
  name: "",
  category: "",
  cue: "",
  difficulty: "medium",
  example_image_url: "",
};

const EMPTY_QC: QcBreakdown = {
  character_consistency: 0,
  composition_consistency: 0,
  artifact_cleanliness: 0,
  text_safety: 0,
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (shouldUseLocalApiRuntime()) {
    return localApiRequest<T>(path, init);
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Unexpected response format from ${path}`);
    }

    const payload = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? `Request failed: ${response.status}`);
    }

    return payload.data;
  } catch (error) {
    if (typeof window !== "undefined") {
      return localApiRequest<T>(path, init);
    }

    throw error;
  }
}

function triggerDownload(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ensureQcDraft(variant: Variant): QcBreakdown {
  return (
    variant.qc_breakdown ?? {
      character_consistency: 3,
      composition_consistency: 3,
      artifact_cleanliness: 3,
      text_safety: 5,
    }
  );
}

function statusBadgeClass(status: Variant["status"]): string {
  switch (status) {
    case "best":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-400/50";
    case "pass":
      return "bg-sky-500/20 text-sky-100 border-sky-400/50";
    case "fail":
      return "bg-rose-500/20 text-rose-100 border-rose-400/50";
    default:
      return "bg-zinc-700/40 text-zinc-200 border-zinc-500/50";
  }
}

export default function PromptCopilotApp() {
  const [lockedCore, setLockedCore] = useState<LockedCore>(DEFAULT_LOCKED_CORE);
  const [scenes, setScenes] = useState<SceneCard[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);

  const [sceneDraft, setSceneDraft] = useState<SceneDraft>(EMPTY_SCENE);
  const [techniqueDraft, setTechniqueDraft] = useState<TechniqueDraft>(EMPTY_TECHNIQUE);

  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>("");
  const [variantCount, setVariantCount] = useState<number>(DEFAULT_VARIANT_COUNT);
  const [threshold, setThreshold] = useState<number>(DEFAULT_QC_THRESHOLD);
  const [passOnly, setPassOnly] = useState(false);

  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [activeScene, setActiveScene] = useState<SceneCard | null>(null);
  const [activeTechnique, setActiveTechnique] = useState<Technique | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [qcDrafts, setQcDrafts] = useState<Record<string, QcBreakdown>>({});

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);

  const selectedScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId],
  );

  const selectedTechnique = useMemo(
    () => techniques.find((technique) => technique.id === selectedTechniqueId) ?? null,
    [techniques, selectedTechniqueId],
  );

  const visibleVariants = useMemo(() => {
    if (!passOnly) {
      return variants;
    }

    return variants.filter((variant) => variant.status === "pass" || variant.status === "best");
  }, [passOnly, variants]);

  const refreshRuns = useCallback(async () => {
    const data = await apiRequest<RunSummary[]>("/api/runs");
    setRuns(data);
  }, []);

  const openRun = useCallback(async (runId: string) => {
    const data = await apiRequest<RunDetails>(`/api/runs/${runId}`);

    setActiveRun(data.run);
    setActiveScene(data.scene);
    setActiveTechnique(data.technique);
    setVariants(data.variants);
    setThreshold(data.run.pass_threshold);

    const nextDrafts: Record<string, QcBreakdown> = {};
    for (const variant of data.variants) {
      nextDrafts[variant.id] = ensureQcDraft(variant);
    }
    setQcDrafts(nextDrafts);
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);

        const [lockedCoreData, sceneData, techniqueData, runData] = await Promise.all([
          apiRequest<LockedCore>("/api/locked-core"),
          apiRequest<SceneCard[]>("/api/scenes"),
          apiRequest<Technique[]>("/api/techniques"),
          apiRequest<RunSummary[]>("/api/runs"),
        ]);

        if (!mounted) {
          return;
        }

        const lockedCoreDraft = localStorage.getItem(STORAGE_KEYS.lockedCore);
        if (lockedCoreDraft) {
          setLockedCore(JSON.parse(lockedCoreDraft) as LockedCore);
        } else {
          setLockedCore(lockedCoreData);
        }

        setScenes(sceneData);
        setTechniques(techniqueData);
        setRuns(runData);

        const generatorDraft = localStorage.getItem(STORAGE_KEYS.generator);
        if (generatorDraft) {
          const parsed = JSON.parse(generatorDraft) as {
            sceneId?: string;
            techniqueId?: string;
            variantCount?: number;
            passOnly?: boolean;
          };
          if (parsed.sceneId) setSelectedSceneId(parsed.sceneId);
          if (parsed.techniqueId) setSelectedTechniqueId(parsed.techniqueId);
          if (parsed.variantCount) setVariantCount(parsed.variantCount);
          if (parsed.passOnly) setPassOnly(parsed.passOnly);
        } else {
          if (sceneData.length > 0) setSelectedSceneId(sceneData[0].id);
          if (techniqueData.length > 0) setSelectedTechniqueId(techniqueData[0].id);
        }

        if (runData.length > 0) {
          await openRun(runData[0].id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to bootstrap app");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [openRun]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lockedCore, JSON.stringify(lockedCore));
  }, [lockedCore]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.generator,
      JSON.stringify({
        sceneId: selectedSceneId,
        techniqueId: selectedTechniqueId,
        variantCount,
        passOnly,
      }),
    );
  }, [passOnly, selectedSceneId, selectedTechniqueId, variantCount]);

  const setMessageSafe = (value: string) => {
    setMessage(value);
    setError("");
  };

  const setErrorSafe = (value: string) => {
    setError(value);
    setMessage("");
  };

  const handleLockedCoreSave = async () => {
    try {
      setBusy(true);
      const next = await apiRequest<LockedCore>("/api/locked-core", {
        method: "PUT",
        body: JSON.stringify(lockedCore),
      });
      setLockedCore(next);
      setMessageSafe("Locked Core saved");
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to save locked core");
    } finally {
      setBusy(false);
    }
  };

  const handleSceneCreate = async () => {
    try {
      setBusy(true);
      const createdScene = await apiRequest<SceneCard>("/api/scenes", {
        method: "POST",
        body: JSON.stringify(sceneDraft),
      });
      setScenes((current) => [...current, createdScene]);
      if (!selectedSceneId) {
        setSelectedSceneId(createdScene.id);
      }
      setSceneDraft(EMPTY_SCENE);
      setMessageSafe("Scene created");
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to create scene");
    } finally {
      setBusy(false);
    }
  };

  const handleTechniqueCreate = async () => {
    try {
      setBusy(true);
      const createdTechnique = await apiRequest<Technique>("/api/techniques", {
        method: "POST",
        body: JSON.stringify(techniqueDraft),
      });
      setTechniques((current) => [...current, createdTechnique]);
      if (!selectedTechniqueId) {
        setSelectedTechniqueId(createdTechnique.id);
      }
      setTechniqueDraft(EMPTY_TECHNIQUE);
      setMessageSafe("Technique created");
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to create technique");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedScene || !selectedTechnique) {
      setErrorSafe("Choose scene and technique before generation");
      return;
    }

    try {
      setBusy(true);
      const data = await apiRequest<{ run: Run; variants: Variant[] }>("/api/runs/generate", {
        method: "POST",
        body: JSON.stringify({
          scene_id: selectedScene.id,
          technique_id: selectedTechnique.id,
          variant_count: variantCount,
          pass_threshold: threshold,
        }),
      });

      setActiveRun(data.run);
      setActiveScene(selectedScene);
      setActiveTechnique(selectedTechnique);
      setVariants(data.variants);
      setQcDrafts(
        data.variants.reduce<Record<string, QcBreakdown>>((acc, variant) => {
          acc[variant.id] = ensureQcDraft(variant);
          return acc;
        }, {}),
      );

      await refreshRuns();
      setMessageSafe(`Generated ${data.variants.length} variants`);
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to generate variants");
    } finally {
      setBusy(false);
    }
  };

  const handleQcDraftChange = (variantId: string, key: keyof QcBreakdown, value: number) => {
    setQcDrafts((current) => ({
      ...current,
      [variantId]: {
        ...(current[variantId] ?? EMPTY_QC),
        [key]: value,
      },
    }));
  };

  const handleScoreVariant = async (variantId: string) => {
    const draft = qcDrafts[variantId];
    if (!draft) {
      setErrorSafe("QC draft missing for variant");
      return;
    }

    try {
      setBusy(true);
      const data = await apiRequest<{ variant: Variant; run: Run | null }>(`/api/variants/${variantId}/qc`, {
        method: "PATCH",
        body: JSON.stringify({ qc_breakdown: draft, threshold }),
      });

      if (data.variant) {
        setVariants((current) => current.map((item) => (item.id === variantId ? data.variant : item)));
      }

      if (data.run) {
        setActiveRun(data.run);
        setThreshold(data.run.pass_threshold);
      }

      await refreshRuns();
      setMessageSafe("QC score updated");
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to score variant");
    } finally {
      setBusy(false);
    }
  };

  const handleMarkBest = async (variantId: string) => {
    if (!activeRun) {
      setErrorSafe("No active run selected");
      return;
    }

    try {
      setBusy(true);
      await apiRequest(`/api/runs/${activeRun.id}/best`, {
        method: "PATCH",
        body: JSON.stringify({ variant_id: variantId }),
      });
      await openRun(activeRun.id);
      await refreshRuns();
      setMessageSafe("Best variant selected");
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to mark best variant");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessageSafe("Prompt copied");
    } catch {
      setErrorSafe("Clipboard unavailable");
    }
  };

  const handleReuseRun = (run: RunSummary) => {
    setSelectedSceneId(run.scene_id);
    setSelectedTechniqueId(run.technique_id);
    setVariantCount(run.variant_count);
    setThreshold(run.pass_threshold);
    setMessageSafe("Run setup loaded into generator");
  };

  const handleExportRun = async (runId: string, format: "json" | "csv") => {
    try {
      setBusy(true);
      const path = `/api/runs/${runId}/export?format=${format}`;

      if (shouldUseLocalApiRuntime()) {
        if (format === "json") {
          const payload = await localApiRequest<unknown>(path);
          triggerDownload(JSON.stringify(payload, null, 2), `${runId}.json`, "application/json");
        } else {
          const csv = await localApiRequest<string>(path);
          triggerDownload(csv, `${runId}.csv`, "text/csv;charset=utf-8");
        }
      } else {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status}`);
        }

        const fileName = `${runId}.${format}`;
        const content = await response.text();
        const contentType = format === "json" ? "application/json" : "text/csv;charset=utf-8";
        triggerDownload(content, fileName, contentType);
      }

      setMessageSafe(`Exported ${runId}.${format}`);
    } catch (requestError) {
      setErrorSafe(requestError instanceof Error ? requestError.message : "Failed to export run");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-zinc-200">Loading Prompt Copilot...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#1d3b45,transparent_40%),radial-gradient(circle_at_85%_10%,#4f2f5a,transparent_38%),linear-gradient(145deg,#0f1722,#131827_40%,#0c1119)] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="rounded-2xl border border-zinc-600/50 bg-zinc-900/60 p-5 backdrop-blur">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Prompt Copilot MVP</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Locked core, scenes, techniques, controlled variation, QC gating, run history, and export.
          </p>
          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </header>

        <main className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr]">
          <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-4" data-testid="locked-core-section">
            <h2 className="text-lg font-semibold text-zinc-100">Locked Core</h2>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-zinc-300">Character Lock</span>
                <textarea
                  data-testid="locked-core-character"
                  className="h-20 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={lockedCore.character_lock}
                  onChange={(event) => setLockedCore((prev) => ({ ...prev, character_lock: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-zinc-300">Style Lock</span>
                <textarea
                  data-testid="locked-core-style"
                  className="h-20 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={lockedCore.style_lock}
                  onChange={(event) => setLockedCore((prev) => ({ ...prev, style_lock: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-zinc-300">Composition Lock</span>
                <textarea
                  className="h-16 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={lockedCore.composition_lock}
                  onChange={(event) => setLockedCore((prev) => ({ ...prev, composition_lock: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-zinc-300">Negative Lock</span>
                <textarea
                  className="h-16 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={lockedCore.negative_lock}
                  onChange={(event) => setLockedCore((prev) => ({ ...prev, negative_lock: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-zinc-300">Text Policy</span>
                <select
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={lockedCore.text_policy}
                  onChange={(event) =>
                    setLockedCore((prev) => ({
                      ...prev,
                      text_policy: event.target.value as LockedCore["text_policy"],
                    }))
                  }
                >
                  <option value="NO-TEXT STRICT">NO-TEXT STRICT</option>
                  <option value="TEXT-ALLOWED">TEXT-ALLOWED</option>
                </select>
              </label>
              <button
                data-testid="save-locked-core-btn"
                className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-medium text-zinc-950 disabled:opacity-40"
                onClick={handleLockedCoreSave}
                disabled={busy}
              >
                Save Locked Core
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-4" data-testid="scene-cards-section">
            <h2 className="text-lg font-semibold text-zinc-100">Scene Cards</h2>
            <div className="mt-3 space-y-2 text-sm">
              <input
                data-testid="scene-title-input"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Title"
                value={sceneDraft.title}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
              <input
                data-testid="scene-goal-input"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Goal"
                value={sceneDraft.goal}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, goal: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Action"
                value={sceneDraft.action}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, action: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Environment"
                value={sceneDraft.environment}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, environment: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Lighting"
                value={sceneDraft.lighting}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, lighting: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Duration hint"
                value={sceneDraft.duration_hint}
                onChange={(event) => setSceneDraft((prev) => ({ ...prev, duration_hint: event.target.value }))}
              />
              <button
                data-testid="add-scene-btn"
                className="w-full rounded-lg bg-fuchsia-500 px-3 py-2 font-medium text-zinc-950 disabled:opacity-40"
                onClick={handleSceneCreate}
                disabled={busy}
              >
                Add Scene
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    selectedSceneId === scene.id
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-zinc-50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300"
                  }`}
                  onClick={() => setSelectedSceneId(scene.id)}
                >
                  <p className="font-medium">{scene.title}</p>
                  <p className="text-zinc-400">{scene.goal}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-4" data-testid="techniques-section">
            <h2 className="text-lg font-semibold text-zinc-100">Technique Library</h2>
            <div className="mt-3 space-y-2 text-sm">
              <input
                data-testid="technique-name-input"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Name"
                value={techniqueDraft.name}
                onChange={(event) => setTechniqueDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Category"
                value={techniqueDraft.category}
                onChange={(event) => setTechniqueDraft((prev) => ({ ...prev, category: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Cue"
                value={techniqueDraft.cue}
                onChange={(event) => setTechniqueDraft((prev) => ({ ...prev, cue: event.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                value={techniqueDraft.difficulty}
                onChange={(event) =>
                  setTechniqueDraft((prev) => ({
                    ...prev,
                    difficulty: event.target.value as TechniqueDraft["difficulty"],
                  }))
                }
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
              <input
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                placeholder="Example image URL (optional)"
                value={techniqueDraft.example_image_url}
                onChange={(event) =>
                  setTechniqueDraft((prev) => ({
                    ...prev,
                    example_image_url: event.target.value,
                  }))
                }
              />
              <button
                data-testid="add-technique-btn"
                className="w-full rounded-lg bg-amber-400 px-3 py-2 font-medium text-zinc-950 disabled:opacity-40"
                onClick={handleTechniqueCreate}
                disabled={busy}
              >
                Add Technique
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {techniques.map((technique) => (
                <button
                  key={technique.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    selectedTechniqueId === technique.id
                      ? "border-amber-300 bg-amber-500/20 text-zinc-50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300"
                  }`}
                  onClick={() => setSelectedTechniqueId(technique.id)}
                >
                  <p className="font-medium">{technique.name}</p>
                  <p className="text-zinc-400">{technique.category}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-4" data-testid="generated-variants-section">
            <h2 className="text-lg font-semibold text-zinc-100">Generated Variants</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <label className="space-y-1">
                <span className="text-zinc-300">Scene</span>
                <select
                  data-testid="scene-select"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={selectedSceneId}
                  onChange={(event) => setSelectedSceneId(event.target.value)}
                >
                  <option value="">Select Scene</option>
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-zinc-300">Technique</span>
                <select
                  data-testid="technique-select"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={selectedTechniqueId}
                  onChange={(event) => setSelectedTechniqueId(event.target.value)}
                >
                  <option value="">Select Technique</option>
                  {techniques.map((technique) => (
                    <option key={technique.id} value={technique.id}>
                      {technique.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-zinc-300">Variant count</span>
                <input
                  data-testid="variant-count-input"
                  type="number"
                  min={1}
                  max={24}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={variantCount}
                  onChange={(event) => setVariantCount(Number(event.target.value))}
                />
              </label>
              <button
                data-testid="generate-variants-btn"
                className="rounded-lg bg-emerald-400 px-3 py-2 font-medium text-zinc-950 disabled:opacity-40"
                onClick={handleGenerate}
                disabled={busy}
              >
                Generate Variants
              </button>
            </div>

            <div className="mt-4 max-h-[540px] space-y-3 overflow-auto pr-1">
              {visibleVariants.map((variant) => {
                const draft = qcDrafts[variant.id] ?? ensureQcDraft(variant);
                return (
                  <article
                    key={variant.id}
                    data-testid="variant-card"
                    className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-zinc-300">{variant.id}</p>
                      <span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${statusBadgeClass(variant.status)}`}>
                        {variant.status}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-400">Seed: {variant.seed}</p>
                    <p className="mt-1 text-zinc-400">
                      Camera: {variant.controls.camera} | Emotion: {variant.controls.emotion} | Motion: {variant.controls.motion}
                    </p>
                    <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-2 text-[11px] whitespace-pre-wrap text-zinc-200">
                      {variant.prompt_text}
                    </pre>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(
                        [
                          ["character_consistency", "Character"],
                          ["composition_consistency", "Composition"],
                          ["artifact_cleanliness", "Artifact"],
                          ["text_safety", "Text safety"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="space-y-1">
                          <span className="text-zinc-400">{label}</span>
                          <select
                            data-testid={`qc-${key}-${variant.id}`}
                            className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-100"
                            value={draft[key]}
                            onChange={(event) => handleQcDraftChange(variant.id, key, Number(event.target.value))}
                          >
                            {[0, 1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded bg-cyan-500 px-2 py-1 text-zinc-950"
                        onClick={() => void handleCopyPrompt(variant.prompt_text)}
                      >
                        Copy prompt
                      </button>
                      <button
                        className="rounded bg-purple-500 px-2 py-1 text-zinc-100"
                        onClick={() => void handleScoreVariant(variant.id)}
                        disabled={busy}
                      >
                        Score QC
                      </button>
                      <button
                        className="rounded bg-emerald-500 px-2 py-1 text-zinc-950"
                        onClick={() => void handleMarkBest(variant.id)}
                        disabled={busy || !activeRun}
                      >
                        Mark best
                      </button>
                    </div>
                    {variant.qc_score !== null ? (
                      <p className="mt-2 text-zinc-300">QC Score: {variant.qc_score}</p>
                    ) : null}
                  </article>
                );
              })}
              {visibleVariants.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-400">
                  No variants yet. Generate a run to start.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-4" data-testid="qc-history-section">
            <h2 className="text-lg font-semibold text-zinc-100">QC / Run History</h2>

            <div className="mt-3 space-y-2 text-sm">
              <label className="space-y-1">
                <span className="text-zinc-300">Pass threshold</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={passOnly}
                  onChange={(event) => setPassOnly(event.target.checked)}
                />
                Show pass/best only
              </label>
              {activeRun ? (
                <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
                  <p>Active run: {activeRun.id}</p>
                  <p>
                    {activeScene?.title ?? "-"} / {activeTechnique?.name ?? "-"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 max-h-[530px] space-y-2 overflow-auto pr-1">
              {runs.map((run) => (
                <article key={run.id} data-testid="run-history-item" className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs">
                  <p className="font-mono text-zinc-300">{run.id}</p>
                  <p className="text-zinc-400">{run.scene_title}</p>
                  <p className="text-zinc-400">{run.technique_name}</p>
                  <p className="text-zinc-500">
                    {run.pass_count}/{run.variant_count} pass | threshold {run.pass_threshold}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className="rounded bg-zinc-200 px-2 py-1 text-zinc-900"
                      onClick={() => void openRun(run.id)}
                    >
                      Open run
                    </button>
                    <button
                      className="rounded bg-blue-500 px-2 py-1 text-white"
                      onClick={() => handleReuseRun(run)}
                    >
                      Reuse prompt
                    </button>
                    <button
                      data-testid={`export-json-${run.id}`}
                      className="rounded bg-zinc-700 px-2 py-1 text-zinc-100"
                      onClick={() => void handleExportRun(run.id, "json")}
                      disabled={busy}
                    >
                      Export JSON
                    </button>
                    <button
                      data-testid={`export-csv-${run.id}`}
                      className="rounded bg-zinc-700 px-2 py-1 text-zinc-100"
                      onClick={() => void handleExportRun(run.id, "csv")}
                      disabled={busy}
                    >
                      Export CSV
                    </button>
                  </div>
                </article>
              ))}
              {runs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-400">
                  Run history will appear after first generation.
                </p>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
