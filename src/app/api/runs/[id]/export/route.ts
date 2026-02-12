import { NextResponse } from "next/server";

import { buildExportRows, rowsToCsv } from "@/lib/api/export";
import { fail, ok } from "@/lib/api/http";
import { readStore } from "@/lib/storage/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "json";

  const store = await readStore();
  const run = store.runs.find((item) => item.id === id);
  if (!run) {
    return fail("Run not found", 404);
  }

  const scene = store.scenes.find((item) => item.id === run.scene_id);
  const technique = store.techniques.find((item) => item.id === run.technique_id);

  if (!scene || !technique) {
    return fail("Run dependencies not found", 404);
  }

  const variants = store.variants.filter((item) => item.run_id === run.id);
  const rows = buildExportRows(run, scene, technique, variants);

  if (format === "csv") {
    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${run.id}.csv"`,
      },
    });
  }

  return ok({ run, scene, technique, variants, rows });
}
