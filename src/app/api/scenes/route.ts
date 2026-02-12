import { createId } from "@/lib/domain/id";
import { createSceneSchema, updateSceneSchema } from "@/lib/domain/schemas";
import { created, fail, ok } from "@/lib/api/http";
import { mutateStore, readStore } from "@/lib/storage/store";

export async function GET() {
  const store = await readStore();
  return ok(store.scenes);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = createSceneSchema.parse(payload);
    const scene = { id: createId("scene"), ...parsed };

    await mutateStore((draft) => {
      draft.scenes.push(scene);
    });

    return created(scene);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid scene payload", 400);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = updateSceneSchema.parse(payload);

    const next = await mutateStore((draft) => {
      const index = draft.scenes.findIndex((scene) => scene.id === parsed.id);
      if (index < 0) {
        throw new Error("Scene not found");
      }

      draft.scenes[index] = parsed;
    });

    const scene = next.scenes.find((item) => item.id === parsed.id);
    return ok(scene);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid scene update", 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return fail("Missing scene id", 400);
    }

    await mutateStore((draft) => {
      draft.scenes = draft.scenes.filter((scene) => scene.id !== id);
      draft.runs = draft.runs.filter((run) => run.scene_id !== id);
      const runIds = new Set(draft.runs.map((run) => run.id));
      draft.variants = draft.variants.filter((variant) => runIds.has(variant.run_id));
    });

    return ok({ id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to delete scene", 400);
  }
}
