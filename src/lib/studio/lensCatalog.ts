import type { CreatorCategory, GoalTag } from "@/lib/studio/catalog";

export type LensTypeId =
  | "spherical_prime"
  | "clean_premium"
  | "anamorphic"
  | "macro"
  | "tele"
  | "wide"
  | "vintage_soft"
  | "zoom_doc";

export type LensAperturePreset = "f/2.0" | "f/2.8" | "f/4" | "f/5.6" | "f/8";

export type LensTypeDefinition = {
  id: LensTypeId;
  title: string;
  subtitle: string;
  tags: string[];
  defaults: {
    suggestedFocal: {
      min: number;
      max: number;
      defaultMm: number;
    };
    suggestedAperture: {
      min: number;
      max: number;
      defaultValue: LensAperturePreset;
    };
  };
  focalFilter: {
    min: number;
    max: number;
  };
  copyHints: {
    focal: string;
    aperture: string;
  };
};

export type LensSeriesDefinition = {
  id: string;
  typeId: LensTypeId;
  title: string;
  description: string;
  tags: string[];
  bias: {
    flare: number;
    softness: number;
    cleanliness: number;
    look: string;
    focalShiftMm?: number;
    apertureShiftStops?: number;
  };
};

export type LensDerivedRecommendations = {
  focalOptions: number[];
  defaultFocal: number;
  defaultAperture: LensAperturePreset;
  copyHints: {
    focal: string;
    aperture: string;
    look: string;
    flareHint: string | null;
  };
  focalReason: string;
  apertureReason: string;
};

export type LensDerivedInput = {
  typeId: LensTypeId;
  seriesId: string | null;
  availableFocals: number[];
};

const APERTURE_NUMERIC_ORDER = [2.0, 2.8, 4, 5.6, 8] as const;
const APERTURE_LABEL_ORDER: LensAperturePreset[] = ["f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"];

const GOAL_GROUPS: Record<"texture" | "portrait" | "beauty" | "catalog" | "night", string[]> = {
  texture: ["texture"],
  portrait: ["cleanportrait", "cleanportrait"],
  beauty: ["beautygloss", "beauty gloss"],
  catalog: ["catalog"],
  night: ["nightmood", "night mood"],
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("-", "")
    .replaceAll("_", "")
    .replaceAll("/", "");
}

function matchesGoal(goal: GoalTag | string | null | undefined, group: keyof typeof GOAL_GROUPS): boolean {
  const normalizedGoal = normalize(goal);
  return GOAL_GROUPS[group].some((item) => normalize(item) === normalizedGoal);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestNumeric(value: number, options: readonly number[]): number {
  let nearest = options[0] ?? value;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const option of options) {
    const distance = Math.abs(option - value);
    if (distance < nearestDistance) {
      nearest = option;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function apertureLabelToNumeric(label: LensAperturePreset): number {
  const index = APERTURE_LABEL_ORDER.findIndex((item) => item === label);
  return APERTURE_NUMERIC_ORDER[index] ?? 2.8;
}

function numericToApertureLabel(value: number): LensAperturePreset {
  const nearest = nearestNumeric(value, APERTURE_NUMERIC_ORDER);
  const index = APERTURE_NUMERIC_ORDER.findIndex((item) => item === nearest);
  return APERTURE_LABEL_ORDER[index] ?? "f/2.8";
}

function shiftAperture(base: LensAperturePreset, stops: number): LensAperturePreset {
  const baseNumeric = apertureLabelToNumeric(base);
  const shifted = baseNumeric * 2 ** stops;
  return numericToApertureLabel(shifted);
}

function findNearestFocal(target: number, options: number[]): number {
  if (options.length === 0) {
    return target;
  }
  return nearestNumeric(target, options);
}

export const LENS_TYPES: LensTypeDefinition[] = [
  {
    id: "spherical_prime",
    title: "Spherical Prime",
    subtitle: "чистая геометрия, универсальный кино-look",
    tags: ["Универсал", "Кино", "Чисто"],
    defaults: {
      suggestedFocal: { min: 24, max: 85, defaultMm: 50 },
      suggestedAperture: { min: 2, max: 4, defaultValue: "f/2.8" },
    },
    focalFilter: { min: 24, max: 85 },
    copyHints: {
      focal: "Сферический прайм: чистая геометрия и универсальная перспектива.",
      aperture: "Держите f/2.8–f/4 для предсказуемой резкости и аккуратного отделения.",
    },
  },
  {
    id: "clean_premium",
    title: "Master Prime (clean premium)",
    subtitle: "премиальная резкость и кожа",
    tags: ["Премиум", "Резкость", "Кожа"],
    defaults: {
      suggestedFocal: { min: 35, max: 100, defaultMm: 50 },
      suggestedAperture: { min: 2, max: 4, defaultValue: "f/2.8" },
    },
    focalFilter: { min: 35, max: 100 },
    copyHints: {
      focal: "Clean premium: держит фактуру кожи аккуратно и без лишнего цифрового шума.",
      aperture: "Чаще всего f/2.8–f/4 дают коммерчески безопасный премиум-look.",
    },
  },
  {
    id: "anamorphic",
    title: "Anamorphic",
    subtitle: "кино-стрейч и характерные блики",
    tags: ["Блики", "Кино", "Характер"],
    defaults: {
      suggestedFocal: { min: 40, max: 100, defaultMm: 50 },
      suggestedAperture: { min: 2.8, max: 5.6, defaultValue: "f/4" },
    },
    focalFilter: { min: 40, max: 100 },
    copyHints: {
      focal: "Anamorphic: широкий кино-кадр, овальное боке и выразительная пластика.",
      aperture: "На f/4 проще контролировать характер и читаемость без лишней мягкости.",
    },
  },
  {
    id: "macro",
    title: "Macro 100mm",
    subtitle: "фактура, детали, крупные планы",
    tags: ["Деталь", "Фактура", "Крупно"],
    defaults: {
      suggestedFocal: { min: 60, max: 120, defaultMm: 105 },
      suggestedAperture: { min: 4, max: 8, defaultValue: "f/5.6" },
    },
    focalFilter: { min: 60, max: 120 },
    copyHints: {
      focal: "Macro: сверхкрупно, подчёркивает текстуру и микродетали.",
      aperture: "У макро малая ГРИП, поэтому чаще безопаснее f/4–f/8 и стабильный фокус.",
    },
  },
  {
    id: "tele",
    title: "Telephoto Prime",
    subtitle: "сильная компрессия и отделение",
    tags: ["Компрессия", "Портрет", "Отделение"],
    defaults: {
      suggestedFocal: { min: 85, max: 200, defaultMm: 105 },
      suggestedAperture: { min: 2.8, max: 4, defaultValue: "f/2.8" },
    },
    focalFilter: { min: 85, max: 200 },
    copyHints: {
      focal: "Tele: компрессия перспективы и сильное отделение фона.",
      aperture: "f/2.8–f/4 помогают сохранить объем и контроль резкости на герое.",
    },
  },
  {
    id: "wide",
    title: "Wide Prime",
    subtitle: "пространство и окружение",
    tags: ["Широко", "Окружение", "Локация"],
    defaults: {
      suggestedFocal: { min: 14, max: 35, defaultMm: 24 },
      suggestedAperture: { min: 2.8, max: 5.6, defaultValue: "f/4" },
    },
    focalFilter: { min: 14, max: 35 },
    copyHints: {
      focal: "Wide: показывает пространство и окружение, особенно в интерьере.",
      aperture: "На широких чаще держат f/4–f/5.6 для читаемости глубины и краёв.",
    },
  },
  {
    id: "vintage_soft",
    title: "Vintage / Soft",
    subtitle: "мягкость, характер, меньше цифровой резкости",
    tags: ["Мягко", "Характер", "Ностальгия"],
    defaults: {
      suggestedFocal: { min: 35, max: 85, defaultMm: 50 },
      suggestedAperture: { min: 1.4, max: 2.8, defaultValue: "f/2.0" },
    },
    focalFilter: { min: 35, max: 85 },
    copyHints: {
      focal: "Vintage/Soft: мягкость и характер вместо стерильной цифровой резкости.",
      aperture: "Открытая диафрагма (f/2.0–f/2.8) усиливает характер и мягкие переходы.",
    },
  },
  {
    id: "zoom_doc",
    title: "Zoom (doc)",
    subtitle: "гибкость и скорость для run&gun",
    tags: ["Док", "Скорость", "Гибкость"],
    defaults: {
      suggestedFocal: { min: 24, max: 120, defaultMm: 50 },
      suggestedAperture: { min: 2.8, max: 5.6, defaultValue: "f/4" },
    },
    focalFilter: { min: 24, max: 120 },
    copyHints: {
      focal: "Zoom/doc: быстро меняйте планы без смены стекла.",
      aperture: "Держите f/4–f/5.6 для стабильной резкости на динамичных сценах.",
    },
  },
];

export const LENS_SERIES: LensSeriesDefinition[] = [
  {
    id: "spherical_zeiss_cp3",
    typeId: "spherical_prime",
    title: "ZEISS CP.3",
    description: "Чистый нейтральный рендер и предсказуемый коммерческий результат.",
    tags: ["Нейтрально", "Коммерция", "Надежно"],
    bias: { flare: 0.3, softness: 0.2, cleanliness: 0.85, look: "чистый и аккуратный", apertureShiftStops: 0.4 },
  },
  {
    id: "spherical_leica_summicron_c",
    typeId: "spherical_prime",
    title: "Leica Summicron-C",
    description: "Плотный контраст и аккуратный премиальный микроконтраст.",
    tags: ["Премиум", "Контраст", "Кожа"],
    bias: { flare: 0.35, softness: 0.25, cleanliness: 0.8, look: "плотный cinematic", apertureShiftStops: 0.3 },
  },
  {
    id: "spherical_cooke_sp3",
    typeId: "spherical_prime",
    title: "Cooke SP3",
    description: "Тёплая кожа и немного более мягкий характер с фирменным roll-off.",
    tags: ["Тепло", "Кожа", "Характер"],
    bias: { flare: 0.45, softness: 0.65, cleanliness: 0.5, look: "тёплый cinematic", apertureShiftStops: -0.3 },
  },
  {
    id: "clean_zeiss_supreme",
    typeId: "clean_premium",
    title: "ZEISS Supreme Prime",
    description: "Премиальная детализация и чистая геометрия для рекламы.",
    tags: ["Премиум", "Деталь", "Чисто"],
    bias: { flare: 0.25, softness: 0.2, cleanliness: 0.92, look: "ультрачистый премиум", apertureShiftStops: 0.5 },
  },
  {
    id: "clean_leica_summilux_c",
    typeId: "clean_premium",
    title: "Leica Summilux-C",
    description: "Кинематографичная пластика с аккуратной кожей и контролируемыми хайлайтами.",
    tags: ["Кино", "Кожа", "Пластика"],
    bias: { flare: 0.4, softness: 0.35, cleanliness: 0.85, look: "плотный дорогой look", apertureShiftStops: 0.2 },
  },
  {
    id: "clean_arri_signature",
    typeId: "clean_premium",
    title: "ARRI Signature Prime",
    description: "Мягкие переходы и объём без потери читаемости деталей.",
    tags: ["ARRI", "Объем", "Премиум"],
    bias: { flare: 0.45, softness: 0.5, cleanliness: 0.75, look: "объёмный премиум", apertureShiftStops: -0.2 },
  },
  {
    id: "anamorphic_atlas_orion",
    typeId: "anamorphic",
    title: "Atlas Orion",
    description: "Выразительные горизонтальные блики и заметный кино-характер.",
    tags: ["Блики", "Характер", "Кино"],
    bias: { flare: 0.85, softness: 0.55, cleanliness: 0.45, look: "яркий кино-характер", apertureShiftStops: -0.4 },
  },
  {
    id: "anamorphic_hawk_vlite",
    typeId: "anamorphic",
    title: "Hawk V-Lite",
    description: "Контролируемый анаморфный look с чуть более чистым рендером.",
    tags: ["Анаморф", "Контроль", "Премиум"],
    bias: { flare: 0.7, softness: 0.45, cleanliness: 0.6, look: "контролируемый anamorphic", apertureShiftStops: 0.1 },
  },
  {
    id: "anamorphic_panavision_g",
    typeId: "anamorphic",
    title: "Panavision G-Series",
    description: "Винтажный анаморф с мягкостью и активной работой контрового.",
    tags: ["Vintage", "Контровой", "Блики"],
    bias: { flare: 0.9, softness: 0.7, cleanliness: 0.35, look: "винтажный anamorphic", apertureShiftStops: -0.5 },
  },
  {
    id: "macro_laowa_probe",
    typeId: "macro",
    title: "Laowa Probe 24mm",
    description: "Экстремальные макро-ракурсы, высокая требовательность к свету и фокусу.",
    tags: ["Экстрим", "Макро", "Фактура"],
    bias: { flare: 0.35, softness: 0.4, cleanliness: 0.7, look: "экспериментальный макро", focalShiftMm: -10, apertureShiftStops: 0.4 },
  },
  {
    id: "macro_zeiss_makro_planar",
    typeId: "macro",
    title: "ZEISS Makro-Planar",
    description: "Очень чистая фактура и высокий микроконтраст в деталях.",
    tags: ["Чисто", "Детали", "Фактура"],
    bias: { flare: 0.2, softness: 0.2, cleanliness: 0.9, look: "максимальная фактура", apertureShiftStops: 0.6 },
  },
  {
    id: "macro_sigma_cine_macro",
    typeId: "macro",
    title: "Sigma Cine Macro",
    description: "Контролируемая резкость и стабильный коммерческий макро-look.",
    tags: ["Коммерция", "Резкость", "Стабильно"],
    bias: { flare: 0.25, softness: 0.25, cleanliness: 0.88, look: "чистый макро", apertureShiftStops: 0.5 },
  },
  {
    id: "tele_leica_summicron_c",
    typeId: "tele",
    title: "Leica Summicron-C (tele)",
    description: "Чистый телепортрет, аккуратная кожа и premium compression.",
    tags: ["Телепортрет", "Премиум", "Чисто"],
    bias: { flare: 0.35, softness: 0.3, cleanliness: 0.82, look: "чистый tele-премиум", focalShiftMm: 10, apertureShiftStops: 0.2 },
  },
  {
    id: "tele_cooke_s4",
    typeId: "tele",
    title: "Cooke S4/i (tele)",
    description: "Более мягкий характер и приятный roll-off в теле-диапазоне.",
    tags: ["Характер", "Мягко", "Портрет"],
    bias: { flare: 0.55, softness: 0.65, cleanliness: 0.5, look: "мягкий tele-character", apertureShiftStops: -0.3 },
  },
  {
    id: "tele_zeiss_supreme",
    typeId: "tele",
    title: "ZEISS Supreme Prime (tele)",
    description: "Очень точная детализация и контролируемая геометрия в длинном фокусе.",
    tags: ["Детали", "Компрессия", "Чисто"],
    bias: { flare: 0.3, softness: 0.25, cleanliness: 0.9, look: "резкий tele-clean", apertureShiftStops: 0.5 },
  },
  {
    id: "wide_zeiss_supreme",
    typeId: "wide",
    title: "ZEISS Supreme Prime (wide)",
    description: "Широкий угол с чистой геометрией и стабильной детализацией.",
    tags: ["Широко", "Чисто", "Архитектура"],
    bias: { flare: 0.25, softness: 0.2, cleanliness: 0.9, look: "чистый wide", apertureShiftStops: 0.5 },
  },
  {
    id: "wide_sigma_ff",
    typeId: "wide",
    title: "Sigma FF High-Speed (wide)",
    description: "Быстрый широкий сет с хорошей резкостью и нейтральным цветом.",
    tags: ["Быстро", "Wide", "Нейтрально"],
    bias: { flare: 0.35, softness: 0.3, cleanliness: 0.82, look: "универсальный wide", apertureShiftStops: 0.2 },
  },
  {
    id: "wide_cooke_s7",
    typeId: "wide",
    title: "Cooke S7/i (wide)",
    description: "Немного более мягкий wide-рисунок с характерным объемом.",
    tags: ["Объем", "Характер", "Локация"],
    bias: { flare: 0.5, softness: 0.6, cleanliness: 0.58, look: "характерный wide", apertureShiftStops: -0.2 },
  },
  {
    id: "vintage_cooke_s4",
    typeId: "vintage_soft",
    title: "Cooke S4/i",
    description: "Классический мягкий character look с органичным roll-off.",
    tags: ["Классика", "Мягко", "Character"],
    bias: { flare: 0.6, softness: 0.75, cleanliness: 0.45, look: "классический soft cinematic", apertureShiftStops: -0.4 },
  },
  {
    id: "vintage_kowa_rehoused",
    typeId: "vintage_soft",
    title: "Kowa Rehoused Vintage",
    description: "Выраженный винтажный характер и более активные блики.",
    tags: ["Vintage", "Flare", "Ностальгия"],
    bias: { flare: 0.85, softness: 0.8, cleanliness: 0.3, look: "винтажный dream look", apertureShiftStops: -0.5 },
  },
  {
    id: "vintage_canon_k35",
    typeId: "vintage_soft",
    title: "Canon K-35 (rehoused)",
    description: "Мягкие хайлайты, теплый skin tone и кино-ретро пластика.",
    tags: ["Тепло", "Кожа", "Ретро"],
    bias: { flare: 0.7, softness: 0.72, cleanliness: 0.4, look: "тёплый vintage", apertureShiftStops: -0.4 },
  },
  {
    id: "zoom_angenieux_optimo",
    typeId: "zoom_doc",
    title: "Angenieux Optimo",
    description: "Премиальный zoom с быстрым рекадром и стабильным рендером.",
    tags: ["Zoom", "Премиум", "Run&Gun"],
    bias: { flare: 0.4, softness: 0.35, cleanliness: 0.78, look: "премиальный doc-zoom", apertureShiftStops: 0.2 },
  },
  {
    id: "zoom_fujinon_cabrio",
    typeId: "zoom_doc",
    title: "Fujinon Cabrio",
    description: "Документальная скорость и предсказуемая резкость по диапазону.",
    tags: ["Док", "Скорость", "Резкость"],
    bias: { flare: 0.35, softness: 0.28, cleanliness: 0.82, look: "чистый doc-zoom", apertureShiftStops: 0.4 },
  },
  {
    id: "zoom_dzo_pictor",
    typeId: "zoom_doc",
    title: "DZOFilm Pictor",
    description: "Немного более мягкий бюджетный cine zoom с характером.",
    tags: ["Бюджет", "Характер", "Гибко"],
    bias: { flare: 0.55, softness: 0.6, cleanliness: 0.55, look: "гибкий zoom-character", apertureShiftStops: -0.2 },
  },
];

export function getLensType(typeId: LensTypeId): LensTypeDefinition {
  return LENS_TYPES.find((item) => item.id === typeId) ?? LENS_TYPES[0]!;
}

export function getLensSeries(seriesId: string | null | undefined): LensSeriesDefinition | null {
  if (!seriesId) {
    return null;
  }
  return LENS_SERIES.find((item) => item.id === seriesId) ?? null;
}

export function getLensSeriesByType(typeId: LensTypeId): LensSeriesDefinition[] {
  return LENS_SERIES.filter((item) => item.typeId === typeId);
}

export function resolveLensTypeIdFromProfile(profile: string | null | undefined): LensTypeId | null {
  const normalizedProfile = normalize(profile);
  if (!normalizedProfile) {
    return null;
  }

  for (const type of LENS_TYPES) {
    if (normalizedProfile.includes(normalize(type.title))) {
      return type.id;
    }
  }

  return null;
}

export function buildLensProfileLabel(typeId: LensTypeId, seriesId: string | null): string {
  const type = getLensType(typeId);
  const series = getLensSeries(seriesId);

  if (!series || series.typeId !== type.id) {
    return type.title;
  }

  return `${type.title} • ${series.title}`;
}

export function recommendLensTypeByContext(input: {
  category?: CreatorCategory | string | null;
  goal?: GoalTag | string | null;
}): LensTypeId {
  const categoryKey = normalize(input.category);
  const goalKey = normalize(input.goal);

  if (categoryKey === normalize("Interiors")) {
    return "wide";
  }

  if (matchesGoal(goalKey, "texture") && categoryKey === normalize("Food")) {
    return "macro";
  }

  if (matchesGoal(goalKey, "texture")) {
    return "macro";
  }

  if (matchesGoal(goalKey, "night")) {
    return "anamorphic";
  }

  if (matchesGoal(goalKey, "catalog") || categoryKey === normalize("Product")) {
    return "clean_premium";
  }

  if (matchesGoal(goalKey, "portrait") || matchesGoal(goalKey, "beauty")) {
    return "clean_premium";
  }

  return "spherical_prime";
}

export function deriveLensRecommendations(input: LensDerivedInput): LensDerivedRecommendations {
  const type = getLensType(input.typeId);
  const series = getLensSeries(input.seriesId);
  const effectiveSeries = series && series.typeId === type.id ? series : null;

  const filteredFocals = input.availableFocals
    .filter((focal) => focal >= type.focalFilter.min && focal <= type.focalFilter.max)
    .sort((a, b) => a - b);
  const focalOptions = filteredFocals.length > 0 ? filteredFocals : [...input.availableFocals].sort((a, b) => a - b);

  const baseDefaultFocal = findNearestFocal(type.defaults.suggestedFocal.defaultMm, focalOptions);
  const focalShift = effectiveSeries?.bias.focalShiftMm ?? 0;
  const defaultFocal = findNearestFocal(baseDefaultFocal + focalShift, focalOptions);

  const baseAperture = type.defaults.suggestedAperture.defaultValue;
  let apertureShift = effectiveSeries?.bias.apertureShiftStops ?? 0;

  if (effectiveSeries) {
    if (effectiveSeries.bias.softness >= 0.65) {
      apertureShift -= 0.5;
    }
    if (effectiveSeries.bias.cleanliness >= 0.7) {
      apertureShift += 0.5;
    }
  }

  const defaultAperture = shiftAperture(baseAperture, clamp(apertureShift, -0.8, 0.8));
  const flareHint = effectiveSeries && effectiveSeries.bias.flare >= 0.65
    ? "Серия даёт активные блики: в контровом используйте флаг/матбокс для контроля flare."
    : null;

  const copyHints = {
    focal: type.copyHints.focal,
    aperture: type.copyHints.aperture,
    look: effectiveSeries ? `Look: ${effectiveSeries.bias.look}. ${effectiveSeries.description}` : `Look: ${type.subtitle}`,
    flareHint,
  };

  const focalReason = effectiveSeries
    ? `${type.title}: рекомендовано ${defaultFocal} мм c учётом серии ${effectiveSeries.title}.`
    : `${type.title}: рекомендовано ${defaultFocal} мм по дефолту типа.`;

  const apertureReason = effectiveSeries
    ? `${type.title}: рекомендовано ${defaultAperture} c bias серии ${effectiveSeries.title}.`
    : `${type.title}: рекомендовано ${defaultAperture} по дефолту типа.`;

  return {
    focalOptions,
    defaultFocal,
    defaultAperture,
    copyHints,
    focalReason,
    apertureReason,
  };
}
