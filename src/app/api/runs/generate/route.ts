import { DEFAULT_QC_THRESHOLD, DEFAULT_VARIANT_COUNT } from "@/lib/domain/defaults";
import { createId } from "@/lib/domain/id";
import { generateRunSchema } from "@/lib/domain/schemas";
import type { Run } from "@/lib/domain/types";
import { generateVariants } from "@/lib/prompt/generateVariants";
import { created, fail } from "@/lib/api/http";
import { mutateStore, readStore } from "@/lib/storage/store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = generateRunSchema.parse(payload);

    const store = await readStore();
    const scene = store.scenes.find((item) => item.id === parsed.scene_id);
    const technique = store.techniques.find((item) => item.id === parsed.technique_id);

    if (!scene) {
      return fail("Scene not found", 404);
    }

    if (!technique) {
      return fail("Technique not found", 404);
    }

    const runId = createId("run");
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

    await mutateStore((draft) => {
      draft.runs.push(run);
      draft.variants.push(...variants);
    });

    return created({ run, variants });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to generate run", 400);
  }
}
