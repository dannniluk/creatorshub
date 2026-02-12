import { DEFAULT_QC_THRESHOLD } from "@/lib/domain/defaults";
import type { QcBreakdown, QcScoreResult } from "@/lib/domain/types";

const QC_WEIGHTS = {
  character_consistency: 0.35,
  composition_consistency: 0.3,
  artifact_cleanliness: 0.2,
  text_safety: 0.15,
} as const;

export function scoreQc(breakdown: QcBreakdown, threshold = DEFAULT_QC_THRESHOLD): QcScoreResult {
  const weighted =
    breakdown.character_consistency * QC_WEIGHTS.character_consistency +
    breakdown.composition_consistency * QC_WEIGHTS.composition_consistency +
    breakdown.artifact_cleanliness * QC_WEIGHTS.artifact_cleanliness +
    breakdown.text_safety * QC_WEIGHTS.text_safety;

  const score = Math.round((weighted / 5) * 100);
  const status = score >= threshold ? "pass" : "fail";

  return { score, status };
}

export function statusFromScore(score: number | null, threshold: number): "draft" | "pass" | "fail" {
  if (score === null) {
    return "draft";
  }

  return score >= threshold ? "pass" : "fail";
}
