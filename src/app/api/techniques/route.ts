import { createId } from "@/lib/domain/id";
import { createTechniqueSchema, updateTechniqueSchema } from "@/lib/domain/schemas";
import { created, fail, ok } from "@/lib/api/http";
import { mutateStore, readStore } from "@/lib/storage/store";

export async function GET() {
  const store = await readStore();
  return ok(store.techniques);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = createTechniqueSchema.parse(payload);
    const technique = { id: createId("tech"), ...parsed };

    await mutateStore((draft) => {
      draft.techniques.push(technique);
    });

    return created(technique);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid technique payload", 400);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = updateTechniqueSchema.parse(payload);

    const next = await mutateStore((draft) => {
      const index = draft.techniques.findIndex((technique) => technique.id === parsed.id);
      if (index < 0) {
        throw new Error("Technique not found");
      }

      draft.techniques[index] = parsed;
    });

    const technique = next.techniques.find((item) => item.id === parsed.id);
    return ok(technique);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid technique update", 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return fail("Missing technique id", 400);
    }

    await mutateStore((draft) => {
      draft.techniques = draft.techniques.filter((technique) => technique.id !== id);
      draft.runs = draft.runs.filter((run) => run.technique_id !== id);
      const runIds = new Set(draft.runs.map((run) => run.id));
      draft.variants = draft.variants.filter((variant) => runIds.has(variant.run_id));
    });

    return ok({ id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to delete technique", 400);
  }
}
