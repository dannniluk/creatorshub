import { markBestSchema } from "@/lib/domain/schemas";
import { statusFromScore } from "@/lib/qc/scoreQc";
import { fail, ok } from "@/lib/api/http";
import { mutateStore } from "@/lib/storage/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const parsed = markBestSchema.parse(payload);

    const next = await mutateStore((draft) => {
      const run = draft.runs.find((item) => item.id === id);
      if (!run) {
        throw new Error("Run not found");
      }

      const newBest = draft.variants.find((variant) => variant.id === parsed.variant_id);
      if (!newBest || newBest.run_id !== id) {
        throw new Error("Variant not found in run");
      }

      if (run.best_variant_id) {
        const oldBest = draft.variants.find((variant) => variant.id === run.best_variant_id);
        if (oldBest) {
          oldBest.status = statusFromScore(oldBest.qc_score, run.pass_threshold);
        }
      }

      newBest.status = "best";
      run.best_variant_id = newBest.id;
    });

    const run = next.runs.find((item) => item.id === id)!;
    const bestVariant = next.variants.find((item) => item.id === run.best_variant_id) ?? null;

    return ok({ run, best_variant: bestVariant });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to mark best variant", 400);
  }
}
