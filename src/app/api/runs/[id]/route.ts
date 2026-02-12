import { fail, ok } from "@/lib/api/http";
import { readStore } from "@/lib/storage/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const store = await readStore();

  const run = store.runs.find((item) => item.id === id);
  if (!run) {
    return fail("Run not found", 404);
  }

  const variants = store.variants.filter((item) => item.run_id === id);
  const scene = store.scenes.find((item) => item.id === run.scene_id) ?? null;
  const technique = store.techniques.find((item) => item.id === run.technique_id) ?? null;

  return ok({ run, scene, technique, variants });
}
