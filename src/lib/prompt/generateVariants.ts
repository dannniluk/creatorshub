import { DEFAULT_VARIANT_COUNT, MAX_VARIANT_COUNT, MIN_VARIANT_COUNT } from "@/lib/domain/defaults";
import { createDeterministicRandom, deriveSeed, hashToSeed } from "@/lib/domain/seed";
import type { GenerateVariantsInput, Variant, VariantControls } from "@/lib/domain/types";
import { applyControls } from "@/lib/prompt/applyControls";
import { buildPrompt } from "@/lib/prompt/buildPrompt";

const CAMERA_OPTIONS = [
  "wide establishing shot",
  "medium shot",
  "close-up portrait",
  "dynamic over-the-shoulder",
  "low-angle cinematic",
];

const EMOTION_OPTIONS = [
  "calm confidence",
  "focused intensity",
  "subtle anticipation",
  "restrained excitement",
  "quiet determination",
];

const MOTION_OPTIONS = [
  "slow push-in",
  "gentle handheld sway",
  "static locked frame",
  "smooth lateral tracking",
  "micro parallax drift",
];

function clampVariantCount(value?: number): number {
  if (!value) {
    return DEFAULT_VARIANT_COUNT;
  }

  return Math.min(MAX_VARIANT_COUNT, Math.max(MIN_VARIANT_COUNT, Math.floor(value)));
}

function pickControl(random: () => number, options: string[]): string {
  const index = Math.floor(random() * options.length);
  return options[index] ?? options[0];
}

function createControls(seed: number): VariantControls {
  const random = createDeterministicRandom(seed);
  return {
    camera: pickControl(random, CAMERA_OPTIONS),
    emotion: pickControl(random, EMOTION_OPTIONS),
    motion: pickControl(random, MOTION_OPTIONS),
  };
}

export function generateVariants(input: GenerateVariantsInput): Variant[] {
  const count = clampVariantCount(input.variantCount);
  const basePrompt = buildPrompt({
    lockedCore: input.lockedCore,
    scene: input.scene,
    technique: input.technique,
  });

  const rootSeed =
    input.baseSeed ?? hashToSeed(`${input.runId}:${input.scene.id}:${input.technique.id}:${count}`);

  return Array.from({ length: count }).map((_, index) => {
    const seed = deriveSeed(rootSeed, index + 1);
    const controls = createControls(seed);

    return {
      id: `${input.runId}_v${index + 1}`,
      run_id: input.runId,
      seed,
      controls,
      prompt_text: applyControls(basePrompt, controls),
      qc_breakdown: null,
      qc_score: null,
      status: "draft",
    };
  });
}
