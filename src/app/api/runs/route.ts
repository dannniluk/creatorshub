import { ok } from "@/lib/api/http";
import { readStore } from "@/lib/storage/store";

export async function GET() {
  const store = await readStore();

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

  return ok(runs);
}
