import type { CreatorCategory, GoalTag, SlidersMapping, TechSettings } from "@/lib/studio/catalog";

type SliderLevel = "Низко" | "Средне" | "Высоко";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

export function sliderLevelLabel(value: number): SliderLevel {
  const normalized = normalize(value);
  if (normalized <= 33) {
    return "Низко";
  }
  if (normalized <= 66) {
    return "Средне";
  }
  return "Высоко";
}

function mapDetailToAperture(detail: number): string {
  if (detail <= 16) {
    return "f/2.0";
  }
  if (detail <= 33) {
    return "f/2.8";
  }
  if (detail <= 50) {
    return "f/2.8";
  }
  if (detail <= 66) {
    return "f/4";
  }
  if (detail <= 84) {
    return "f/5.6";
  }
  return "f/8";
}

function mapBlurToFocal(backgroundBlur: number): number {
  if (backgroundBlur <= 15) {
    return 24;
  }
  if (backgroundBlur <= 33) {
    return 35;
  }
  if (backgroundBlur <= 50) {
    return 35;
  }
  if (backgroundBlur <= 66) {
    return 50;
  }
  if (backgroundBlur <= 85) {
    return 85;
  }
  if (backgroundBlur <= 95) {
    return 105;
  }
  return 135;
}

function mapLight(category: CreatorCategory, goal: GoalTag, lightDrama: number): string {
  if (lightDrama <= 33) {
    if (category === "Food") {
      return "Softbox overhead";
    }
    return "Мягкий ключ с деликатным заполнением";
  }

  if (lightDrama <= 66) {
    if (goal === "Clean portrait" || goal === "Beauty gloss") {
      return "Rembrandt";
    }
    return "Кинематографичный направленный ключ";
  }

  if (goal === "Texture") {
    return "Split lighting";
  }

  return "Контровой свет с плотным контрастом";
}

function mapLens(category: CreatorCategory, goal: GoalTag, detail: number, backgroundBlur: number): string {
  if (goal === "Texture") {
    return "Macro 100mm";
  }

  if (goal === "Night mood" && backgroundBlur >= 67) {
    return "Telephoto Prime";
  }

  if (goal === "Beauty gloss") {
    return "Spherical Prime";
  }

  if (category === "Interiors" && backgroundBlur <= 45) {
    return "Wide Prime";
  }

  if (goal === "Cinematic drama") {
    return detail >= 55 ? "Master Prime" : "Spherical Prime";
  }

  return "Spherical Prime";
}

export function mapSlidersToTech(input: {
  base: TechSettings;
  category: CreatorCategory;
  goal: GoalTag;
  sliders: SlidersMapping;
}): TechSettings {
  const detail = normalize(input.sliders.detail);
  const backgroundBlur = normalize(input.sliders.backgroundBlur);
  const lightDrama = normalize(input.sliders.lightDrama);

  let aperture = mapDetailToAperture(detail);
  let focal = mapBlurToFocal(backgroundBlur);
  let lighting = mapLight(input.category, input.goal, lightDrama);
  const lensProfile = mapLens(input.category, input.goal, detail, backgroundBlur);

  if (input.goal === "Texture") {
    lighting = "Split lighting";
    focal = clamp(focal, 85, 105);
    aperture = detail >= 67 ? "f/5.6" : "f/4";
  }

  if (input.goal === "Beauty gloss") {
    lighting = lightDrama >= 50 ? "Butterfly / Paramount" : "Beauty dish frontal";
    focal = clamp(focal, 85, 105);
    if (detail <= 33) {
      aperture = "f/2.0";
    } else if (detail <= 66) {
      aperture = "f/2.8";
    } else {
      aperture = "f/4";
    }
  }

  if (input.goal === "Catalog") {
    lighting = input.category === "Food" ? "Softbox overhead" : "Мягкий ключ с деликатным заполнением";
    aperture = detail >= 67 ? "f/8" : "f/5.6";
    if (input.category === "People" && backgroundBlur >= 67) {
      focal = 85;
    } else {
      focal = backgroundBlur <= 33 ? 35 : 50;
    }
  }

  if (input.goal === "Night mood") {
    lighting = lightDrama >= 67 ? "Контровой свет с плотным контрастом" : "Blue hour ambient";
    focal = backgroundBlur >= 67 ? 135 : 85;
    aperture = detail >= 60 ? "f/2.8" : "f/2.0";
  }

  return {
    camera: input.base.camera,
    lens_profile: lensProfile,
    focal_mm: focal,
    aperture,
    lighting,
  };
}
