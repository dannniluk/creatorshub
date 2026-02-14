import type { CreatorCategory, GoalTag } from "@/lib/studio/catalog";
import nanoBananaProConfig from "@/lib/studio/config/nano-banana-pro.ru.json";

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

type ConfigLensTypeId =
  | "spherical_prime"
  | "clean_premium_prime"
  | "anamorphic"
  | "macro_100"
  | "telephoto_prime"
  | "wide_prime"
  | "vintage_soft"
  | "zoom_doc";

type ConfigLensSeries = {
  id: string;
  typeId: ConfigLensTypeId;
  title: string;
  tags: string[];
  bias: {
    flare: number;
    softness: number;
    cleanliness: number;
  };
};

const CONFIG_TYPE_TO_INTERNAL: Record<ConfigLensTypeId, LensTypeId> = {
  spherical_prime: "spherical_prime",
  clean_premium_prime: "clean_premium",
  anamorphic: "anamorphic",
  macro_100: "macro",
  telephoto_prime: "tele",
  wide_prime: "wide",
  vintage_soft: "vintage_soft",
  zoom_doc: "zoom_doc",
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

const schemaLensTypes = nanoBananaProConfig.lensCatalog?.lensTypes ?? [];
for (const schemaType of schemaLensTypes) {
  const internalType = CONFIG_TYPE_TO_INTERNAL[schemaType.id as ConfigLensTypeId];
  if (!internalType) {
    continue;
  }

  const existing = LENS_TYPES.find((item) => item.id === internalType);
  if (!existing) {
    continue;
  }

  existing.title = schemaType.title || existing.title;
  existing.tags = schemaType.tags?.length ? [...schemaType.tags] : existing.tags;
}

export const LENS_SERIES: LensSeriesDefinition[] = [
  {
    id: "spherical_canon_cn_e_prime",
    typeId: "spherical_prime",
    title: "Canon CN-E Prime",
    description:
      "Надежные кино-праймы с понятной картинкой и удобным фокусом. Отличный выбор для продакшна, если нужна стабильность и скорость.",
    tags: ["Надежно", "Продакшн", "Понятно"],
    bias: { flare: 0.35, softness: 0.34, cleanliness: 0.76, look: "стабильный cinema-prime", apertureShiftStops: 0.2 },
  },
  {
    id: "spherical_sigma_ff_high_speed",
    typeId: "spherical_prime",
    title: "Sigma FF High Speed Prime",
    description:
      "Доступная «проф» линейка: резкая, быстрая по свету, удобная в работе. Для клипов и коммерции, когда нужен максимум за свои деньги.",
    tags: ["Бюджет", "Светосила", "Резко"],
    bias: { flare: 0.4, softness: 0.32, cleanliness: 0.8, look: "резкий budget-pro", apertureShiftStops: 0.15 },
  },
  {
    id: "spherical_sony_cinealta_prime",
    typeId: "spherical_prime",
    title: "Sony CineAlta Prime",
    description:
      "Современная чистота и ровный цвет, хорошо дружит с быстрым темпом съемок. Для рекламы/интервью, где важен аккуратный результат.",
    tags: ["Clean", "Цвет", "Темп"],
    bias: { flare: 0.35, softness: 0.28, cleanliness: 0.83, look: "современный clean", apertureShiftStops: 0.25 },
  },
  {
    id: "clean_zeiss_supreme",
    typeId: "clean_premium",
    title: "ZEISS Supreme Prime",
    description:
      "Очень чистая, контрастная и предсказуемая оптика. Когда нужен современный «дорогой digital», максимум резкости без сюрпризов.",
    tags: ["Clean", "Modern", "Коммерция"],
    bias: { flare: 0.22, softness: 0.2, cleanliness: 0.94, look: "дорогой modern digital", apertureShiftStops: 0.55 },
  },
  {
    id: "clean_leica_summilux_c",
    typeId: "clean_premium",
    title: "Leica Summilux-C",
    description:
      "Премиум-резкость без «цифровой жесткости», очень красивый микроконтраст. Для фэшн/рекламы, где нужна элитная картинка.",
    tags: ["Премиум", "Микроконтраст", "Фэшн"],
    bias: { flare: 0.36, softness: 0.38, cleanliness: 0.86, look: "элитный premium prime", apertureShiftStops: 0.25 },
  },
  {
    id: "clean_arri_signature",
    typeId: "clean_premium",
    title: "ARRI Signature Prime",
    description:
      "Кино-портретный премиум: плавные хайлайты, естественная кожа и объем. Когда хочется «Alexa-вайб» и максимальную “пластичность”.",
    tags: ["Кино", "Кожа", "Объем"],
    bias: { flare: 0.42, softness: 0.55, cleanliness: 0.78, look: "пластичный cinema premium", apertureShiftStops: -0.15 },
  },
  {
    id: "clean_schneider_xenon_ff",
    typeId: "clean_premium",
    title: "Schneider Xenon FF Prime",
    description:
      "Честная, ровная оптика: аккуратный контраст и стабильная цветопередача. Для коммерции и брендов, где нужен нейтральный look.",
    tags: ["Ровно", "Нейтрально", "Бренды"],
    bias: { flare: 0.3, softness: 0.27, cleanliness: 0.84, look: "нейтральный brand-safe", apertureShiftStops: 0.35 },
  },
  {
    id: "anamorphic_atlas_orion",
    typeId: "anamorphic",
    title: "Atlas Orion Anamorphic",
    description:
      "Анаморфик с ярким «кино-эффектом»: широкий кадр, характерные блики и овальное боке. Когда нужно сразу “кино” без хитростей.",
    tags: ["Анаморф", "Блики", "Кино-вайб"],
    bias: { flare: 0.86, softness: 0.58, cleanliness: 0.45, look: "яркий anamorphic-vibe", apertureShiftStops: -0.4 },
  },
  {
    id: "anamorphic_hawk_vlite",
    typeId: "anamorphic",
    title: "Hawk V-Lite Anamorphic",
    description:
      "Более «премиальная» анаморфная картинка: чище, контролируемее, но всё равно с характером. Для рекламы/фильма, где важен контроль.",
    tags: ["Анаморф", "Премиум", "Контроль"],
    bias: { flare: 0.72, softness: 0.46, cleanliness: 0.62, look: "контролируемый anamorphic premium", apertureShiftStops: 0.1 },
  },
  {
    id: "anamorphic_panavision_g",
    typeId: "anamorphic",
    title: "Panavision G-Series Anamorphic",
    description:
      "Винтажный анаморф: сильный характер, мягкость и “пленочное” чувство. Когда хочется не идеальности, а атмосферы и истории.",
    tags: ["Винтаж", "Характер", "Атмосфера"],
    bias: { flare: 0.9, softness: 0.72, cleanliness: 0.34, look: "винтажный anamorphic story-look", apertureShiftStops: -0.5 },
  },
  {
    id: "macro_laowa_probe",
    typeId: "macro",
    title: "Laowa Probe Macro (24mm Probe)",
    description:
      "Спец-макро для экстремальных крупных планов и «проезда» внутри объектов. Для предметки/beauty, когда нужно вау-детали и движение.",
    tags: ["Макро", "Вау-детали", "Предметка"],
    bias: { flare: 0.36, softness: 0.42, cleanliness: 0.7, look: "special macro wow", focalShiftMm: -10, apertureShiftStops: 0.4 },
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
    id: "tele_zeiss_supreme",
    typeId: "tele",
    title: "ZEISS Supreme Prime (tele)",
    description:
      "Очень чистая, контрастная и предсказуемая оптика. Когда нужен современный «дорогой digital», максимум резкости без сюрпризов.",
    tags: ["Clean", "Modern", "Коммерция"],
    bias: { flare: 0.3, softness: 0.24, cleanliness: 0.9, look: "дорогой tele-clean", apertureShiftStops: 0.45 },
  },
  {
    id: "tele_cooke_s4",
    typeId: "tele",
    title: "Cooke S4/i (tele)",
    description:
      "Классический «Cooke look»: мягче, теплее, кожа выглядит приятнее. Когда важнее характер и лицо, чем абсолютная резкость.",
    tags: ["Кожа", "Тепло", "Характер"],
    bias: { flare: 0.55, softness: 0.68, cleanliness: 0.5, look: "тёплый tele-character", apertureShiftStops: -0.3 },
  },
  {
    id: "wide_tokina_vista_prime",
    typeId: "wide",
    title: "Tokina Vista Prime",
    description:
      "Крупная картинка и «киношный» рисунок, подходит под большие сенсоры. Когда важно чувство масштаба и запас под кадрирование.",
    tags: ["Большой сенсор", "Кино", "Запас"],
    bias: { flare: 0.45, softness: 0.42, cleanliness: 0.72, look: "масштабный big-circle", focalShiftMm: -6, apertureShiftStops: 0.1 },
  },
  {
    id: "wide_zeiss_supreme",
    typeId: "wide",
    title: "ZEISS Supreme Prime (wide)",
    description:
      "Очень чистая, контрастная и предсказуемая оптика. Когда нужен современный «дорогой digital», максимум резкости без сюрпризов.",
    tags: ["Clean", "Modern", "Коммерция"],
    bias: { flare: 0.25, softness: 0.2, cleanliness: 0.9, look: "чистый wide-premium", apertureShiftStops: 0.5 },
  },
  {
    id: "wide_sigma_ff",
    typeId: "wide",
    title: "Sigma FF High-Speed (wide)",
    description:
      "Доступная «проф» линейка: резкая, быстрая по свету, удобная в работе. Для клипов и коммерции, когда нужен максимум за свои деньги.",
    tags: ["Бюджет", "Светосила", "Резко"],
    bias: { flare: 0.35, softness: 0.3, cleanliness: 0.82, look: "универсальный wide", apertureShiftStops: 0.2 },
  },
  {
    id: "vintage_cooke_s4",
    typeId: "vintage_soft",
    title: "Cooke S4/i",
    description:
      "Классический «Cooke look»: мягче, теплее, кожа выглядит приятнее. Когда важнее характер и лицо, чем абсолютная резкость.",
    tags: ["Кожа", "Тепло", "Характер"],
    bias: { flare: 0.6, softness: 0.76, cleanliness: 0.45, look: "классический cooke-look", apertureShiftStops: -0.4 },
  },
  {
    id: "zoom_angenieux_optimo",
    typeId: "zoom_doc",
    title: "Angénieux Optimo Zoom (24–290 / 28–76)",
    description:
      "Эталон кино-зума: быстро, удобно и очень “дорого” выглядит. Когда нужно менять планы без смены стекол и не терять качество.",
    tags: ["Зум", "Премиум", "Скорость"],
    bias: { flare: 0.4, softness: 0.35, cleanliness: 0.78, look: "премиальный cinema-zoom", apertureShiftStops: 0.2 },
  },
  {
    id: "zoom_fujinon_cabrio",
    typeId: "zoom_doc",
    title: "Fujinon Cabrio Zoom (19–90 / 85–300)",
    description:
      "Зум для дока/run&gun: серво-ручка, скорость работы, стабильный результат. Для съемок «в движении», где нет времени на перестановки.",
    tags: ["Док", "Run&Gun", "Скорость"],
    bias: { flare: 0.35, softness: 0.28, cleanliness: 0.82, look: "чистый doc-zoom", apertureShiftStops: 0.4 },
  },
  {
    id: "zoom_dzo_pictor",
    typeId: "zoom_doc",
    title: "DZOFilm Pictor Zoom",
    description:
      "Бюджетный кино-зум с приличной картинкой и удобной механикой. Для небольших команд, когда важна гибкость без космического бюджета.",
    tags: ["Бюджет", "Гибкость", "Кино"],
    bias: { flare: 0.55, softness: 0.6, cleanliness: 0.55, look: "гибкий budget cinema-zoom", apertureShiftStops: -0.2 },
  },
];

const schemaLensSeries = (nanoBananaProConfig.lensCatalog?.lensSeries ?? []) as ConfigLensSeries[];
for (const schemaSeries of schemaLensSeries) {
  const internalType = CONFIG_TYPE_TO_INTERNAL[schemaSeries.typeId];
  if (!internalType) {
    continue;
  }

  const existing = LENS_SERIES.find((item) => item.id === schemaSeries.id);
  if (existing) {
    existing.typeId = internalType;
    existing.title = schemaSeries.title || existing.title;
    existing.tags = schemaSeries.tags?.length ? [...schemaSeries.tags] : existing.tags;
    existing.bias = {
      ...existing.bias,
      flare: schemaSeries.bias.flare,
      softness: schemaSeries.bias.softness,
      cleanliness: schemaSeries.bias.cleanliness,
    };
    continue;
  }

  LENS_SERIES.push({
    id: schemaSeries.id,
    typeId: internalType,
    title: schemaSeries.title,
    description: `Профессиональная серия ${schemaSeries.title}.`,
    tags: schemaSeries.tags ?? [],
    bias: {
      flare: schemaSeries.bias.flare,
      softness: schemaSeries.bias.softness,
      cleanliness: schemaSeries.bias.cleanliness,
      look: (schemaSeries.tags ?? []).slice(0, 2).join(" · ") || schemaSeries.title,
    },
  });
}

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
