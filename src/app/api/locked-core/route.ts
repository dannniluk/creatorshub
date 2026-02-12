import { lockedCoreSchema } from "@/lib/domain/schemas";
import { ok, fail } from "@/lib/api/http";
import { mutateStore, readStore } from "@/lib/storage/store";

export async function GET() {
  const store = await readStore();
  return ok(store.locked_core);
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = lockedCoreSchema.parse(payload);

    const next = await mutateStore((draft) => {
      draft.locked_core = parsed;
    });

    return ok(next.locked_core);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid locked core payload", 400);
  }
}
