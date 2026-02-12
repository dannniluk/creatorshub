import type { Run, SceneCard, Technique, Variant } from "@/lib/domain/types";

export type ExportRow = {
  run_id: string;
  scene_id: string;
  scene_title: string;
  technique_name: string;
  variant_id: string;
  seed: number;
  qc_score: number | null;
  status: string;
  prompt_text: string;
  created_at: string;
};

export function buildExportRows(
  run: Run,
  scene: SceneCard,
  technique: Technique,
  variants: Variant[],
): ExportRow[] {
  return variants.map((variant) => ({
    run_id: run.id,
    scene_id: scene.id,
    scene_title: scene.title,
    technique_name: technique.name,
    variant_id: variant.id,
    seed: variant.seed,
    qc_score: variant.qc_score,
    status: variant.status,
    prompt_text: variant.prompt_text,
    created_at: run.created_at,
  }));
}

const CSV_HEADERS = [
  "run_id",
  "scene_id",
  "scene_title",
  "technique_name",
  "variant_id",
  "seed",
  "qc_score",
  "status",
  "prompt_text",
  "created_at",
] as const;

function csvEscape(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const text = String(value).replaceAll('"', '""');
  if (/[",\n]/.test(text)) {
    return `"${text}"`;
  }

  return text;
}

export function rowsToCsv(rows: ExportRow[]): string {
  const headerLine = CSV_HEADERS.join(",");
  const lines = rows.map((row) => CSV_HEADERS.map((key) => csvEscape(row[key])).join(","));
  return [headerLine, ...lines].join("\n");
}
