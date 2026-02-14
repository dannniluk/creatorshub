import type { CreatorCategory, GoalTag, PresetLocks, StudioTaskPreset } from "@/lib/studio/catalog";

export type ProWizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type ProWizardScene = {
  goal: string;
  action: string;
  environment: string;
};

export type ProWizardOutput = {
  compactPrompt: string;
  fullPrompt: string;
};

export type ProWizardState = {
  step: ProWizardStep;
  camera: string;
  lens_profile: string;
  focal_mm: number;
  aperture: string;
  lighting_style: string;
  locks: PresetLocks;
  scene: ProWizardScene;
  output: ProWizardOutput;
};

export type ProCameraOption = {
  label: string;
  bestFor: string;
  chips: string[];
  category: CreatorCategory;
};

export type ProLensOption = {
  label: string;
  effect: string;
};

export type ProLightingOption = {
  label: string;
  bestFor: string;
};

export type ProFocalOption = {
  mm: number;
  label: string;
  bestFor: string[];
  description: string;
  group: "wide" | "standard" | "portrait" | "macro" | "tele";
  defaultWhen: string[];
};

export type ProFocalRecommendationRule = {
  when: {
    category?: CreatorCategory | string;
    goal?: GoalTag | string;
  };
  recommendedMm: number;
  reason: string;
};

export type ProFocalUI = {
  title: string;
  helperText: {
    default: string;
    ranges: Array<{
      range: string;
      text: string;
    }>;
  };
  options: ProFocalOption[];
  recommendationRules: ProFocalRecommendationRule[];
};

export type ProApertureRecommendationRule = {
  when: {
    category?: CreatorCategory | string;
    goal?: GoalTag | string;
  };
  recommendedAperture: (typeof PRO_APERTURE_PRESETS)[number];
  reason: string;
};

export type ProApertureUI = {
  title: string;
  helperText: {
    default: string;
    ranges: Array<{
      range: string;
      text: string;
    }>;
  };
  presets: readonly (typeof PRO_APERTURE_PRESETS)[number][];
  recommendationRules: ProApertureRecommendationRule[];
};

export const DEFAULT_REQUIRED_NEGATIVE_LOCK = [
  "no watermark",
  "no text",
  "no deformed faces/hands",
  "no extra fingers",
  "no artifacts",
] as const;

export const PRO_CAMERA_OPTIONS: ProCameraOption[] = [
  {
    label: "Digital Full Frame",
    bestFor: "универсальная коммерция, чисто и предсказуемо",
    chips: ["Чисто", "Универсал", "Safe"],
    category: "People",
  },
  {
    label: "ARRI ALEXA Mini LF",
    bestFor: "кино-цвет и мягкие хайлайты, премиум портрет",
    chips: ["Кино-цвет", "Портрет", "Премиум"],
    category: "People",
  },
  {
    label: "RED V-RAPTOR 8K VV",
    bestFor: "максимум деталей и запас под пост/VFX",
    chips: ["Детали", "VFX", "Ночь"],
    category: "Product",
  },
  {
    label: "Sony A1",
    bestFor: "быстро и резкое, идеально для темпа и автофокуса",
    chips: ["Быстро", "Резко", "Коммерция"],
    category: "Product",
  },
  {
    label: "Canon EOS R5",
    bestFor: "мягкая кожа и аккуратный контраст",
    chips: ["Кожа", "Beauty", "Бренды"],
    category: "People",
  },
  {
    label: "Nikon Z8",
    bestFor: "контроль фактуры и деталей",
    chips: ["Фактура", "Предметка", "Детали"],
    category: "Product",
  },
  {
    label: "Fujifilm GFX100 II",
    bestFor: "medium format пластика и градиенты",
    chips: ["Премиум", "Тон", "Фактура"],
    category: "Fashion",
  },
  {
    label: "Hasselblad X2D 100C",
    bestFor: "натуральный цвет, спокойная тональность",
    chips: ["Natural", "Портрет", "Beauty"],
    category: "People",
  },
  {
    label: "Blackmagic URSA Mini Pro 12K",
    bestFor: "кино продакшн, детализация под клинап",
    chips: ["Кино", "Продакшн", "Пост"],
    category: "Product",
  },
  {
    label: "Sony FX3",
    bestFor: "кино-лайт, low light, run&gun",
    chips: ["Low light", "Док", "Быстро"],
    category: "People",
  },
  {
    label: "Sony FX6",
    bestFor: "универсальная кино-камера, кожа и динамический диапазон",
    chips: ["Интервью", "Кино", "Универсал"],
    category: "People",
  },
  {
    label: "Panasonic LUMIX S5 II",
    bestFor: "доступная кино-универсал, стабильный цвет",
    chips: ["Универсал", "Бюджет", "Кино"],
    category: "People",
  },
  {
    label: "Canon C70",
    bestFor: "cinema look + документальная удобность",
    chips: ["Док", "Кино", "Надежно"],
    category: "People",
  },
  {
    label: "Nikon Z9",
    bestFor: "спорт/экшен и детализация в темпе",
    chips: ["Экшен", "Резко", "Быстро"],
    category: "People",
  },
  {
    label: "Fujifilm X-H2S",
    bestFor: "контент/экшен, приятный цвет, скорость",
    chips: ["Контент", "Экшен", "Цвет"],
    category: "People",
  },
  {
    label: "iPhone (Cinematic)",
    bestFor: "быстрый контент, клипмейкинг, social",
    chips: ["Быстро", "Social", "Light"],
    category: "People",
  },
];

export const PRO_LENS_OPTIONS: ProLensOption[] = [
  {
    label: "Spherical Prime",
    effect: "чистая геометрия, универсальный кино-look",
  },
  {
    label: "Master Prime (clean premium)",
    effect: "премиальная резкость и кожа",
  },
  {
    label: "Anamorphic",
    effect: "кино-стрейч и характерные блики",
  },
  {
    label: "Macro 100mm",
    effect: "фактура, детали, крупные планы",
  },
  {
    label: "Telephoto Prime",
    effect: "сильная компрессия и отделение",
  },
  {
    label: "Wide Prime",
    effect: "пространство и окружение",
  },
  {
    label: "Vintage / Soft",
    effect: "мягкость, характер, меньше цифровой резкости",
  },
  {
    label: "Zoom (doc)",
    effect: "гибкость и скорость для run&gun",
  },
];

export const PRO_FOCAL_UI: ProFocalUI = {
  title: "Выбери фокусное расстояние",
  helperText: {
    default:
      "Фокусное влияет на «ощущение дистанции»: широко показывает окружение, длинное — сильнее отделяет и «сжимает» фон.",
    ranges: [
      { range: "16–24 мм", text: "Больше пространства и окружения." },
      { range: "35–50 мм", text: "Универсально и естественно." },
      { range: "85–105 мм", text: "Портрет/детали, красивое отделение." },
      { range: "135–200 мм", text: "Дальний план, сильная компрессия фона." },
    ],
  },
  options: [
    {
      mm: 16,
      label: "Широко",
      bestFor: ["интерьеры", "establishing", "окружение героя"],
      description: "Максимум пространства, сильная перспектива.",
      group: "wide",
      defaultWhen: ["Interiors", "Establishing"],
    },
    {
      mm: 24,
      label: "Пространство",
      bestFor: ["мода в локации", "контент", "сцена с окружением"],
      description: "Широко, но без экстремальных искажений.",
      group: "wide",
      defaultWhen: ["Fashion", "Interiors"],
    },
    {
      mm: 35,
      label: "Кино-универсал",
      bestFor: ["лайфстайл", "репортаж", "сторителлинг"],
      description: "Естественно и кинематографично, самый удобный универсал.",
      group: "standard",
      defaultWhen: ["Lifestyle", "Documentary"],
    },
    {
      mm: 50,
      label: "Натурально",
      bestFor: ["каталожка", "продукт", "портрет по пояс"],
      description: "Натуральные пропорции, минимум искажений.",
      group: "standard",
      defaultWhen: ["Catalog", "Product"],
    },
    {
      mm: 85,
      label: "Портрет",
      bestFor: ["крупный портрет", "премиум look", "separation"],
      description: "Классический портрет: приятно отделяет от фона.",
      group: "portrait",
      defaultWhen: ["CleanPortrait", "People"],
    },
    {
      mm: 105,
      label: "Макро/деталь",
      bestFor: ["фактура ткани", "швы", "еда", "beauty-деталь"],
      description: "Лучшее для фактуры и деталей без визуального шума.",
      group: "macro",
      defaultWhen: ["Texture", "Food", "BeautyGloss"],
    },
    {
      mm: 135,
      label: "Дальний",
      bestFor: ["телепортрет", "компрессия", "дорогой look"],
      description: "Сильнее «сжимает» фон, добавляет премиальности.",
      group: "tele",
      defaultWhen: ["NightMood", "CinematicDrama"],
    },
    {
      mm: 200,
      label: "Очень дальний",
      bestFor: ["спорт/сцена", "стрит издалека", "макс. компрессия"],
      description: "Для дальних сцен и максимального отделения.",
      group: "tele",
      defaultWhen: ["Sports", "Stage"],
    },
  ],
  recommendationRules: [
    {
      when: { category: "Fashion", goal: "Texture" },
      recommendedMm: 105,
      reason:
        "Для фактуры ткани важны читаемость швов и рельеф — 105 мм даёт нужную детализацию и спокойный фон.",
    },
    {
      when: { category: "People", goal: "CleanPortrait" },
      recommendedMm: 85,
      reason: "85 мм — классический портрет: приятная перспектива и отделение от фона.",
    },
    {
      when: { category: "People", goal: "BeautyGloss" },
      recommendedMm: 105,
      reason: "105 мм помогает снимать бьюти-детали и текстуру кожи аккуратно и крупно.",
    },
    {
      when: { category: "Food", goal: "Texture" },
      recommendedMm: 105,
      reason: "Для еды и деталей поверхности 105 мм даёт макро-читабельность без лишних искажений.",
    },
    {
      when: { category: "Interiors" },
      recommendedMm: 16,
      reason: "Интерьеры и пространство лучше читаются на широких фокусных.",
    },
    {
      when: { category: "Product", goal: "Catalog" },
      recommendedMm: 50,
      reason: "50 мм даёт натуральные пропорции и стабильный коммерческий вид для товара.",
    },
    {
      when: { goal: "NightMood" },
      recommendedMm: 135,
      reason: "Длинное фокусное даёт компрессию и помогает изолировать объект в ночном mood.",
    },
  ],
};

export const PRO_FOCAL_OPTIONS = PRO_FOCAL_UI.options.map((option) => option.mm);

export const PRO_APERTURE_PRESETS = ["f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;

export const PRO_APERTURE_UI: ProApertureUI = {
  title: "Настрой диафрагму",
  helperText: {
    default:
      "Диафрагма влияет на глубину резкости и на то, сколько света попадает в кадр: открытая — сильнее размывает фон, закрытая — делает сцену более детальной.",
    ranges: [
      { range: "f/2.0–f/2.8", text: "Сильное размытие фона, мягкое отделение объекта, больше света." },
      { range: "f/4", text: "Баланс: объект читается четко, фон остаётся аккуратно отделён." },
      { range: "f/5.6–f/8", text: "Больше деталей в кадре и глубины, безопасно для каталога/предметки." },
    ],
  },
  presets: PRO_APERTURE_PRESETS,
  recommendationRules: [
    {
      when: { category: "People", goal: "Clean portrait" },
      recommendedAperture: "f/2.8",
      reason: "Для чистого портрета f/2.8 даёт мягкое отделение и стабильную резкость на лице.",
    },
    {
      when: { category: "People", goal: "Beauty gloss" },
      recommendedAperture: "f/4",
      reason: "В beauty съёмке f/4 даёт аккуратный баланс между текстурой кожи и мягким фоном.",
    },
    {
      when: { category: "Fashion", goal: "Texture" },
      recommendedAperture: "f/5.6",
      reason: "Для фактуры ткани f/5.6 помогает сохранить читаемость швов и деталей.",
    },
    {
      when: { category: "Food", goal: "Texture" },
      recommendedAperture: "f/5.6",
      reason: "Еда и фактура лучше читаются на f/5.6 без лишнего визуального шума.",
    },
    {
      when: { category: "Product", goal: "Catalog" },
      recommendedAperture: "f/8",
      reason: "Каталожный товар безопаснее с f/8: максимум деталей и предсказуемый коммерческий вид.",
    },
    {
      when: { category: "Interiors" },
      recommendedAperture: "f/8",
      reason: "Для интерьеров f/8 лучше сохраняет глубину пространства и читаемость плоскостей.",
    },
    {
      when: { goal: "Night mood" },
      recommendedAperture: "f/2.0",
      reason: "Ночной mood чаще требует больше света и сильного отделения объекта, поэтому f/2.0.",
    },
  ],
};

export const PRO_LIGHTING_OPTIONS: ProLightingOption[] = [
  {
    label: "Мягкий ключ с деликатным заполнением",
    bestFor: "чистая коммерция, безопасно",
  },
  {
    label: "Кинематографичный направленный ключ",
    bestFor: "объем и кино-драма",
  },
  {
    label: "Rembrandt",
    bestFor: "премиальный портрет с объемом",
  },
  {
    label: "Butterfly / Paramount",
    bestFor: "beauty и ровная кожа",
  },
  {
    label: "Split lighting",
    bestFor: "фактура и рельеф",
  },
  {
    label: "Softbox overhead",
    bestFor: "еда/flatlay сверху",
  },
  {
    label: "Практические источники в кадре",
    bestFor: "атмосфера и мотивация",
  },
  {
    label: "Golden hour backlight",
    bestFor: "теплый outdoor контур",
  },
  {
    label: "Blue hour ambient",
    bestFor: "сумерки и ночной mood",
  },
  {
    label: "Контровой свет с плотным контрастом",
    bestFor: "силуэт и отделение",
  },
  {
    label: "Естественный свет через облачность",
    bestFor: "натуральный lifestyle",
  },
  {
    label: "Beauty dish frontal",
    bestFor: "глянец, контролируемые блики",
  },
];

const DEFAULT_SCENE: ProWizardScene = {
  goal: "Снять сцену с production-safe читаемостью главного объекта.",
  action: "Главный объект статичен, без смаза, фокус чистый.",
  environment: "Нейтральная студия/локация без визуального шума.",
};

export const PRO_LOCK_TEXT = {
  character: "same subject identity across all variants.",
  style: "cinematic realism, clean texture, no stylization.",
  composition: "clear main subject, readable depth, no visual noise.",
  textPolicy: "NO-TEXT STRICT",
  quality: "avoid artifacts, preserve visual consistency, no text in frame.",
};

export const PRO_MIN_STEP: ProWizardStep = 1;
export const PRO_MAX_STEP: ProWizardStep = 6;

function toStep(value: number): ProWizardStep {
  if (value <= PRO_MIN_STEP) {
    return PRO_MIN_STEP;
  }
  if (value >= PRO_MAX_STEP) {
    return PRO_MAX_STEP;
  }
  return value as ProWizardStep;
}

export function clampProStep(step: number): ProWizardStep {
  return toStep(step);
}

export function nextProStep(step: ProWizardStep): ProWizardStep {
  return toStep(step + 1);
}

export function prevProStep(step: ProWizardStep): ProWizardStep {
  return toStep(step - 1);
}

function normalizeRuleLookup(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("-", "")
    .replaceAll("_", "")
    .replaceAll("/", "");
}

export function getFocalOption(focalMm: number): ProFocalOption | null {
  return PRO_FOCAL_UI.options.find((option) => option.mm === focalMm) ?? null;
}

export function getRecommendedFocalRule(input: {
  category?: CreatorCategory | string | null;
  goal?: GoalTag | string | null;
}): ProFocalRecommendationRule | null {
  const categoryKey = normalizeRuleLookup(input.category);
  const goalKey = normalizeRuleLookup(input.goal);

  for (const rule of PRO_FOCAL_UI.recommendationRules) {
    const ruleCategory = normalizeRuleLookup(rule.when.category);
    const ruleGoal = normalizeRuleLookup(rule.when.goal);

    if (ruleCategory && ruleCategory !== categoryKey) {
      continue;
    }

    if (ruleGoal && ruleGoal !== goalKey) {
      continue;
    }

    return rule;
  }

  return null;
}

export function getRecommendedApertureRule(input: {
  category?: CreatorCategory | string | null;
  goal?: GoalTag | string | null;
}): ProApertureRecommendationRule | null {
  const categoryKey = normalizeRuleLookup(input.category);
  const goalKey = normalizeRuleLookup(input.goal);

  for (const rule of PRO_APERTURE_UI.recommendationRules) {
    const ruleCategory = normalizeRuleLookup(rule.when.category);
    const ruleGoal = normalizeRuleLookup(rule.when.goal);

    if (ruleCategory && ruleCategory !== categoryKey) {
      continue;
    }

    if (ruleGoal && ruleGoal !== goalKey) {
      continue;
    }

    return rule;
  }

  return null;
}

export function explainFocalLength(focal: number): string {
  if (focal >= 16 && focal <= 24) {
    return PRO_FOCAL_UI.helperText.ranges[0]?.text ?? PRO_FOCAL_UI.helperText.default;
  }

  if (focal >= 35 && focal <= 50) {
    return PRO_FOCAL_UI.helperText.ranges[1]?.text ?? PRO_FOCAL_UI.helperText.default;
  }

  if (focal >= 85 && focal <= 105) {
    return PRO_FOCAL_UI.helperText.ranges[2]?.text ?? PRO_FOCAL_UI.helperText.default;
  }

  if (focal >= 135 && focal <= 200) {
    return PRO_FOCAL_UI.helperText.ranges[3]?.text ?? PRO_FOCAL_UI.helperText.default;
  }

  return PRO_FOCAL_UI.helperText.default;
}

export function explainAperture(aperture: string): string {
  const normalized = aperture.toLowerCase();
  if (normalized === "f/2.0" || normalized === "f/2.8") {
    return PRO_APERTURE_UI.helperText.ranges[0]?.text ?? PRO_APERTURE_UI.helperText.default;
  }

  if (normalized === "f/4") {
    return PRO_APERTURE_UI.helperText.ranges[1]?.text ?? PRO_APERTURE_UI.helperText.default;
  }

  if (normalized === "f/5.6" || normalized === "f/8") {
    return PRO_APERTURE_UI.helperText.ranges[2]?.text ?? PRO_APERTURE_UI.helperText.default;
  }

  return PRO_APERTURE_UI.helperText.default;
}

export function mapBlurSliderToAperture(sliderValue: number): (typeof PRO_APERTURE_PRESETS)[number] {
  const clamped = Math.max(0, Math.min(100, sliderValue));
  const anchors = [0, 25, 50, 75, 100];

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  anchors.forEach((anchor, index) => {
    const distance = Math.abs(anchor - clamped);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return PRO_APERTURE_PRESETS[nearestIndex] ?? PRO_APERTURE_PRESETS[0];
}

function normalizeNegativeLock(input: string[]): string[] {
  const cleaned = input.map((item) => item.trim()).filter(Boolean);
  const merged = new Set([...DEFAULT_REQUIRED_NEGATIVE_LOCK, ...cleaned]);
  return Array.from(merged);
}

export function withTaskSceneDefaults(preset: StudioTaskPreset): ProWizardScene {
  return {
    goal: preset.sceneTemplates.goal[0] ?? DEFAULT_SCENE.goal,
    action: preset.sceneTemplates.action[0] ?? DEFAULT_SCENE.action,
    environment: preset.sceneTemplates.environment[0] ?? DEFAULT_SCENE.environment,
  };
}

export function buildProPrompts(state: Pick<
  ProWizardState,
  "camera" | "lens_profile" | "focal_mm" | "aperture" | "lighting_style" | "locks" | "scene"
>): ProWizardOutput {
  const normalizedNegative = normalizeNegativeLock(state.locks.negativeLock).join(", ");
  const lockCharacter = state.locks.characterLock ? PRO_LOCK_TEXT.character : "off";
  const lockStyle = state.locks.styleLock ? PRO_LOCK_TEXT.style : "off";
  const lockComposition = state.locks.compositionLock ? PRO_LOCK_TEXT.composition : "off";
  const textPolicy = state.locks.noTextStrict ? PRO_LOCK_TEXT.textPolicy : "OFF";

  const compactPrompt = [
    "Nano Banana Pro Prompt",
    "Intent: photoreal cinematic frame with production-safe clarity.",
    `SCENE GOAL: ${state.scene.goal}`,
    `CAMERA FORMAT: ${state.camera}`,
    `LENS/FOCAL/APERTURE: ${state.lens_profile} | ${state.focal_mm}mm | ${state.aperture}`,
    `LIGHTING STYLE: ${state.lighting_style}`,
    `LOCKS: character=${lockCharacter}; style=${lockStyle}; composition=${lockComposition}`,
    `TEXT POLICY: ${textPolicy}`,
  ].join("\n");

  const fullPrompt = [
    "Nano Banana Pro Prompt",
    "Intent: photoreal cinematic frame with production-safe clarity.",
    `SCENE GOAL: ${state.scene.goal}`,
    `SCENE ACTION: ${state.scene.action}`,
    `SCENE ENVIRONMENT: ${state.scene.environment}`,
    `CAMERA FORMAT: ${state.camera}`,
    `LENS TYPE: ${state.lens_profile}`,
    `FOCAL LENGTH: ${state.focal_mm}mm`,
    `APERTURE: ${state.aperture}`,
    `LIGHTING STYLE: ${state.lighting_style}`,
    `CHARACTER LOCK: ${lockCharacter}`,
    `STYLE LOCK: ${lockStyle}`,
    `COMPOSITION LOCK: ${lockComposition}`,
    `NEGATIVE LOCK: ${normalizedNegative}`,
    `TEXT POLICY: ${textPolicy}`,
    `QUALITY NOTES: ${PRO_LOCK_TEXT.quality}`,
  ].join("\n");

  return { compactPrompt, fullPrompt };
}

type ProWizardSeed = {
  camera?: string;
  lens_profile?: string;
  focal_mm?: number;
  aperture?: string;
  lighting_style?: string;
  scene?: Partial<ProWizardScene>;
  locks?: Partial<PresetLocks>;
  step?: ProWizardStep;
};

export function createDefaultProWizard(seed?: ProWizardSeed): ProWizardState {
  const baseLocks: PresetLocks = {
    characterLock: true,
    styleLock: true,
    compositionLock: true,
    noTextStrict: true,
    negativeLock: [...DEFAULT_REQUIRED_NEGATIVE_LOCK],
  };

  const state: ProWizardState = {
    step: seed?.step ?? 1,
    camera: seed?.camera ?? "Digital Full Frame",
    lens_profile: seed?.lens_profile ?? "Spherical Prime",
    focal_mm: seed?.focal_mm ?? 50,
    aperture: seed?.aperture ?? "f/2.8",
    lighting_style: seed?.lighting_style ?? "Мягкий ключ с деликатным заполнением",
    scene: {
      goal: seed?.scene?.goal ?? DEFAULT_SCENE.goal,
      action: seed?.scene?.action ?? DEFAULT_SCENE.action,
      environment: seed?.scene?.environment ?? DEFAULT_SCENE.environment,
    },
    locks: {
      ...baseLocks,
      ...seed?.locks,
      negativeLock: normalizeNegativeLock(seed?.locks?.negativeLock ?? baseLocks.negativeLock),
    },
    output: { compactPrompt: "", fullPrompt: "" },
  };

  return {
    ...state,
    output: buildProPrompts(state),
  };
}

export function patchProWizard(state: ProWizardState, patch: Partial<Omit<ProWizardState, "output">>): ProWizardState {
  const nextState: ProWizardState = {
    ...state,
    ...patch,
    locks: {
      ...state.locks,
      ...patch.locks,
      negativeLock: normalizeNegativeLock(patch.locks?.negativeLock ?? state.locks.negativeLock),
    },
    scene: {
      ...state.scene,
      ...patch.scene,
    },
    output: state.output,
  };

  return {
    ...nextState,
    output: buildProPrompts(nextState),
  };
}
