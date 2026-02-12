import { hashToSeed } from "@/lib/domain/seed";
import type { Core6Setup, PromptPack, StudioSetup } from "@/lib/studio/types";

type VariantRecipe = {
  id: string;
  label: string;
  summary: string;
  mutate: (base: Core6Setup) => Core6Setup;
};

const APERTURE_STEPS = ["f/1.8", "f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;
const FOCAL_STEPS = [24, 35, 50, 85, 105, 135] as const;

const REQUIRED_NEGATIVE = "no watermark, no text, no deformed faces/hands, no extra fingers, no artifacts";
const REQUIRED_TEXT_POLICY = "NO-TEXT STRICT";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shiftAperture(current: string, direction: -1 | 1): string {
  const currentIndex = APERTURE_STEPS.findIndex((item) => item === current);
  const index = currentIndex === -1 ? 2 : currentIndex;
  const nextIndex = clamp(index + direction, 0, APERTURE_STEPS.length - 1);
  return APERTURE_STEPS[nextIndex] ?? current;
}

function shiftFocal(current: number, direction: -1 | 1): number {
  const nearest = FOCAL_STEPS.reduce((closest, step) => {
    return Math.abs(step - current) < Math.abs(closest - current) ? step : closest;
  }, FOCAL_STEPS[0]);

  const currentIndex = FOCAL_STEPS.findIndex((item) => item === nearest);
  const index = currentIndex === -1 ? 2 : currentIndex;
  const nextIndex = clamp(index + direction, 0, FOCAL_STEPS.length - 1);
  return FOCAL_STEPS[nextIndex] ?? current;
}

const VARIANT_RECIPES: VariantRecipe[] = [
  {
    id: "base",
    label: "Base",
    summary: "Сбалансированная production-safe версия",
    mutate: (base) => ({ ...base }),
  },
  {
    id: "detail-plus",
    label: "Detail+",
    summary: "Больше читаемости деталей",
    mutate: (base) => ({
      ...base,
      aperture: shiftAperture(base.aperture, 1),
      lighting_style: "Split lighting",
    }),
  },
  {
    id: "blur-plus",
    label: "Blur+",
    summary: "Более мягкий фон и отделение объекта",
    mutate: (base) => ({
      ...base,
      focal_length_mm: shiftFocal(base.focal_length_mm, 1),
      aperture: shiftAperture(base.aperture, -1),
    }),
  },
  {
    id: "drama-plus",
    label: "Drama+",
    summary: "Более контрастный и атмосферный свет",
    mutate: (base) => ({
      ...base,
      lighting_style: "Контровой свет с плотным контрастом",
    }),
  },
];

function normalizeLocks(setup: StudioSetup): {
  character: string;
  style: string;
  consistency: string;
  negative: string;
} {
  const character = setup.locked_core.character_lock.trim() || "same subject identity across all variants";
  const style = setup.locked_core.style_lock.trim() || "clean photoreal style";
  const consistency = setup.locked_core.composition_lock.trim() || "stable framing and subject placement";
  const customNegative = setup.locked_core.negative_lock.trim();

  const negative = customNegative
    ? `${REQUIRED_NEGATIVE}; ${customNegative}`
    : REQUIRED_NEGATIVE;

  return { character, style, consistency, negative };
}

function buildNanoPrompt(setup: StudioSetup, core6: Core6Setup): string {
  const locks = normalizeLocks(setup);

  return [
    "Nano Banana Pro Prompt",
    `INTENT: ${setup.scene_goal}`,
    `SUBJECT: ${setup.scene_action}`,
    `COMPOSITION: ${locks.consistency}`,
    `ENVIRONMENT: ${setup.scene_environment}`,
    `CAMERA EMULATION: ${core6.camera_format}, ${core6.lens_type}, ${core6.focal_length_mm}mm, ${core6.aperture}`,
    `LIGHTING: ${core6.lighting_style}`,
    `LOCKS: character=${locks.character}; style=${locks.style}; consistency=${locks.consistency}`,
    `NEGATIVE CONSTRAINTS: ${locks.negative}`,
    `TEXT POLICY: ${REQUIRED_TEXT_POLICY}`,
  ].join("\n");
}

function createPackId(setup: StudioSetup, createdAt: string): string {
  const stableHash = hashToSeed(JSON.stringify(setup));
  return `pack_${stableHash}_${createdAt.slice(0, 19).replaceAll(":", "").replace("T", "_")}`;
}

export function generatePromptPack(input: {
  setup: StudioSetup;
  createdAt?: string;
  packId?: string;
}): PromptPack {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const packId = input.packId ?? createPackId(input.setup, createdAt);

  return {
    id: packId,
    created_at: createdAt,
    setup_snapshot: structuredClone(input.setup),
    variants: VARIANT_RECIPES.map((recipe) => {
      const core6 = recipe.mutate(input.setup.core6);
      return {
        id: recipe.id,
        label: recipe.label,
        summary: recipe.summary,
        prompt_nano: buildNanoPrompt(input.setup, core6),
      };
    }),
  };
}
