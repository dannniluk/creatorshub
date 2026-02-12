import type { CreatorCategory, GoalTag, SlidersMapping, TechSettings } from "@/lib/studio/catalog";

const FOCAL_STEPS = [24, 35, 50, 85, 105, 135] as const;
const APERTURE_STEPS = ["f/1.8", "f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestFocal(target: number): number {
  return FOCAL_STEPS.reduce((closest, current) => {
    const currentDelta = Math.abs(current - target);
    const bestDelta = Math.abs(closest - target);
    return currentDelta < bestDelta ? current : closest;
  }, FOCAL_STEPS[0]);
}

function mapLighting(goal: GoalTag, lightDrama: number): string {
  if (goal === "Texture") {
    return lightDrama >= 55 ? "Split lighting" : "Softbox overhead";
  }

  if (goal === "Beauty gloss") {
    return lightDrama > 60 ? "Rembrandt" : "Beauty dish frontal";
  }

  if (goal === "Night mood") {
    return lightDrama > 70 ? "Контровой свет с плотным контрастом" : "Blue hour ambient";
  }

  if (lightDrama < 35) {
    return "Мягкий ключ с деликатным заполнением";
  }
  if (lightDrama < 68) {
    return "Кинематографичный направленный ключ";
  }
  return "Контровой свет с плотным контрастом";
}

function mapLens(category: CreatorCategory, goal: GoalTag, detail: number, backgroundBlur: number): string {
  if (category === "Interiors" && backgroundBlur < 45) {
    return "Wide Prime";
  }

  if (goal === "Texture" || detail > 72) {
    return "Macro 100mm";
  }

  if (goal === "Cinematic drama") {
    return "Anamorphic Prime";
  }

  if (goal === "Clean portrait" || goal === "Beauty gloss") {
    return backgroundBlur > 65 ? "Master Prime" : "Spherical Prime";
  }

  return "Spherical Prime";
}

function mapFocal(category: CreatorCategory, goal: GoalTag, backgroundBlur: number): number {
  if (category === "Interiors") {
    return backgroundBlur < 45 ? 24 : 35;
  }

  if (goal === "Night mood") {
    return backgroundBlur > 70 ? 135 : 50;
  }

  if (goal === "Texture") {
    return backgroundBlur > 60 ? 105 : 85;
  }

  const blurIndex = clamp(Math.round(backgroundBlur / 20), 0, FOCAL_STEPS.length - 1);
  return FOCAL_STEPS[blurIndex] ?? 50;
}

function mapAperture(detail: number, backgroundBlur: number): string {
  const focusNeed = detail - backgroundBlur * 0.65;
  const normalized = clamp((focusNeed + 65) / 165, 0, 1);
  const index = clamp(Math.round(normalized * (APERTURE_STEPS.length - 1)), 0, APERTURE_STEPS.length - 1);
  return APERTURE_STEPS[index] ?? "f/2.8";
}

export function mapSlidersToTech(input: {
  base: TechSettings;
  category: CreatorCategory;
  goal: GoalTag;
  sliders: SlidersMapping;
}): TechSettings {
  const detail = clamp(Math.round(input.sliders.detail), 0, 100);
  const backgroundBlur = clamp(Math.round(input.sliders.backgroundBlur), 0, 100);
  const lightDrama = clamp(Math.round(input.sliders.lightDrama), 0, 100);

  const nextFocal = mapFocal(input.category, input.goal, backgroundBlur);

  return {
    camera_format: input.base.camera_format,
    lens_type: mapLens(input.category, input.goal, detail, backgroundBlur),
    focal_length_mm: nearestFocal(nextFocal),
    aperture: mapAperture(detail, backgroundBlur),
    lighting_style: mapLighting(input.goal, lightDrama),
  };
}
