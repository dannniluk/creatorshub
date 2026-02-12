import { hashToSeed } from "@/lib/domain/seed";
import type { Core6Setup, PromptPack, StudioSetup } from "@/lib/studio/types";

type VariantRecipe = {
  id: string;
  label: string;
  summary: string;
  overrides: Partial<Core6Setup>;
};

const VARIANT_RECIPES: VariantRecipe[] = [
  {
    id: "base",
    label: "Base",
    summary: "Исходная настройка без дополнительных изменений",
    overrides: {},
  },
  {
    id: "wide",
    label: "Wider Frame",
    summary: "Более широкий угол и легкое движение камеры",
    overrides: { focal_length_mm: 24, camera_movement: "Smooth lateral tracking" },
  },
  {
    id: "tight",
    label: "Tight Portrait",
    summary: "Более плотный портретный фокус",
    overrides: { focal_length_mm: 85, aperture: "f/2.0" },
  },
  {
    id: "dynamic",
    label: "Dynamic Motion",
    summary: "Более выраженная динамика движения",
    overrides: { camera_movement: "Energetic forward tracking" },
  },
  {
    id: "soft-light",
    label: "Soft Light",
    summary: "Более мягкий свет и аккуратный контраст",
    overrides: { lighting_style: "Soft diffused key with controlled fill" },
  },
  {
    id: "clean-safe",
    label: "Safety Clean",
    summary: "Консервативная версия для стабильного результата",
    overrides: { aperture: "f/4", camera_movement: "Static locked frame" },
  },
];

function mergeCore6(base: Core6Setup, overrides: Partial<Core6Setup>): Core6Setup {
  return {
    ...base,
    ...overrides,
  };
}

function buildCommonScene(setup: StudioSetup, core6: Core6Setup): string[] {
  return [
    `SCENE GOAL: ${setup.scene_goal}`,
    `SCENE ACTION: ${setup.scene_action}`,
    `SCENE ENVIRONMENT: ${setup.scene_environment}`,
    `CAMERA FORMAT: ${core6.camera_format}`,
    `LENS TYPE: ${core6.lens_type}`,
    `FOCAL LENGTH: ${core6.focal_length_mm}mm`,
    `APERTURE: ${core6.aperture}`,
    `LIGHTING STYLE: ${core6.lighting_style}`,
    `CAMERA MOVEMENT: ${core6.camera_movement}`,
    `CHARACTER LOCK: ${setup.locked_core.character_lock}`,
    `STYLE LOCK: ${setup.locked_core.style_lock}`,
    `COMPOSITION LOCK: ${setup.locked_core.composition_lock}`,
    `NEGATIVE LOCK: ${setup.locked_core.negative_lock}`,
    `TEXT POLICY: ${setup.locked_core.text_policy}`,
  ];
}

function buildNanoPrompt(setup: StudioSetup, core6: Core6Setup): string {
  const lines = buildCommonScene(setup, core6);
  return [
    "Nano Banana Pro Prompt",
    "Intent: photoreal cinematic frame with production-safe clarity.",
    ...lines,
    "QUALITY NOTES: avoid artifacts, preserve visual consistency, no text in frame.",
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
      const core6 = mergeCore6(input.setup.core6, recipe.overrides);
      return {
        id: recipe.id,
        label: recipe.label,
        summary: recipe.summary,
        prompt_nano: buildNanoPrompt(input.setup, core6),
      };
    }),
  };
}
