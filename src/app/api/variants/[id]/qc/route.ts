import { updateQcSchema } from "@/lib/domain/schemas";
import { scoreQc, statusFromScore } from "@/lib/qc/scoreQc";
import { fail, ok } from "@/lib/api/http";
import { mutateStore } from "@/lib/storage/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const parsed = updateQcSchema.parse(payload);

    const next = await mutateStore((draft) => {
      const variant = draft.variants.find((item) => item.id === id);
      if (!variant) {
        throw new Error("Variant not found");
      }

      const run = draft.runs.find((item) => item.id === variant.run_id);
      if (!run) {
        throw new Error("Run not found for variant");
      }

      if (parsed.threshold !== undefined) {
        run.pass_threshold = parsed.threshold;
      }

      const threshold = run.pass_threshold;
      const result = scoreQc(parsed.qc_breakdown, threshold);

      variant.qc_breakdown = parsed.qc_breakdown;
      variant.qc_score = result.score;

      if (run.best_variant_id === variant.id) {
        variant.status = "best";
      } else {
        variant.status = result.status;
      }

      if (parsed.threshold !== undefined) {
        for (const item of draft.variants) {
          if (item.run_id !== run.id || item.id === run.best_variant_id) {
            continue;
          }

          item.status = statusFromScore(item.qc_score, run.pass_threshold);
        }
      }
    });

    const variant = next.variants.find((item) => item.id === id) ?? null;
    const run = variant ? next.runs.find((item) => item.id === variant.run_id) ?? null : null;

    return ok({ variant, run });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update QC", 400);
  }
}
