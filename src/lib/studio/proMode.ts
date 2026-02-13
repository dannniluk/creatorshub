import type { CreatorCategory, PresetLocks, StudioTaskPreset } from "@/lib/studio/catalog";

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

export const PRO_FOCAL_OPTIONS = [16, 24, 35, 50, 85, 105, 135, 200] as const;

export const PRO_APERTURE_PRESETS = ["f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;

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

export function explainFocalLength(focal: number): string {
  if (focal === 16 || focal === 24) {
    return "широко, больше окружения";
  }

  if (focal === 35) {
    return "репортажно-киношный универсал";
  }

  if (focal === 50) {
    return "натуральная перспектива";
  }

  if (focal === 85) {
    return "классический портрет";
  }

  if (focal === 105) {
    return "макро/детали и фактура";
  }

  return "дальний, сильная компрессия";
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
