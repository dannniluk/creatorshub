export type CreatorCategory = "Fashion" | "People" | "Food" | "Product" | "Interiors";

export type GoalTag =
  | "Texture"
  | "Clean portrait"
  | "Beauty gloss"
  | "Cinematic drama"
  | "Night mood"
  | "Catalog";

export type SlidersMapping = {
  detail: number;
  backgroundBlur: number;
  lightDrama: number;
};

export type TechSettings = {
  camera: string;
  lens_profile: string;
  focal_mm: number;
  aperture: string;
  lighting: string;
};

export type PresetLocks = {
  characterLock: boolean;
  styleLock: boolean;
  compositionLock: boolean;
  noTextStrict: boolean;
  negativeLock: string[];
};

export type SceneTemplateSet = {
  goal: string[];
  action: string[];
  environment: string[];
};

export type StudioTaskPreset = {
  id: string;
  category: CreatorCategory;
  goal: GoalTag;
  humanTitle: string;
  benefit: string;
  resultChips: string[];
  recommended: boolean;
  safeDefault: boolean;
  whyWorks: string[];
  defaults: TechSettings;
  sliderDefaults: SlidersMapping;
  promptTemplateCompact: string;
  promptTemplateFull: string;
  locks: PresetLocks;
  sceneTemplates: SceneTemplateSet;
};

export type StudioCatalogCamera = {
  name: string;
  character: string;
  best_for: string[];
  best_combo: {
    lens_profile: string;
    focal_mm: number;
    aperture: string;
    light: string;
  };
};

export type LightSetupGuide = {
  name: string;
  best_for: string[];
  microcopy: string;
};

export type ReferenceTerm = {
  id: string;
  term: string;
  what: string;
  impact: string;
  when: string;
  microcopy: string;
  applyValue?: string;
};

export const BEGINNER_CATEGORIES: readonly CreatorCategory[] = [
  "Fashion",
  "People",
  "Food",
  "Product",
  "Interiors",
] as const;

export const BEGINNER_GOALS: readonly GoalTag[] = [
  "Texture",
  "Clean portrait",
  "Beauty gloss",
  "Cinematic drama",
  "Night mood",
  "Catalog",
] as const;

export const CATEGORY_LABELS: Record<CreatorCategory, string> = {
  Fashion: "Мода",
  People: "Люди",
  Food: "Еда",
  Product: "Товары",
  Interiors: "Интерьеры",
};

export const GOAL_LABELS: Record<GoalTag, string> = {
  Texture: "Фактура",
  "Clean portrait": "Чистый портрет",
  "Beauty gloss": "Beauty gloss",
  "Cinematic drama": "Кинодрама",
  "Night mood": "Ночной mood",
  Catalog: "Каталог",
};

const BASE_LOCKS: PresetLocks = {
  characterLock: true,
  styleLock: true,
  compositionLock: true,
  noTextStrict: true,
  negativeLock: ["no watermark", "no text", "no deformed faces/hands", "no extra fingers", "no artifacts"],
};

const DEFAULT_PROMPT_TEMPLATE_COMPACT = [
  "Nano Banana Pro Prompt",
  "Intent: photoreal cinematic frame with production-safe clarity.",
  "SCENE GOAL: {{SCENE_GOAL}}",
  "CAMERA FORMAT: {{CAMERA}}",
  "LENS/FOCAL/APERTURE: {{LENS_PROFILE}} | {{FOCAL_MM}}mm | {{APERTURE}}",
  "LIGHTING STYLE: {{LIGHTING}}",
  "LOCKS: character={{LOCK_CHARACTER}}; style={{LOCK_STYLE}}; composition={{LOCK_COMPOSITION}}",
  "TEXT POLICY: {{NO_TEXT_POLICY}}",
].join("\n");

const DEFAULT_PROMPT_TEMPLATE_FULL = [
  "Nano Banana Pro Prompt",
  "Intent: photoreal cinematic frame with production-safe clarity.",
  "SCENE GOAL: {{SCENE_GOAL}}",
  "SCENE ACTION: {{SCENE_ACTION}}",
  "SCENE ENVIRONMENT: {{SCENE_ENVIRONMENT}}",
  "CAMERA FORMAT: {{CAMERA}}",
  "LENS TYPE: {{LENS_PROFILE}}",
  "FOCAL LENGTH: {{FOCAL_MM}}mm",
  "APERTURE: {{APERTURE}}",
  "LIGHTING STYLE: {{LIGHTING}}",
  "CHARACTER LOCK: {{LOCK_CHARACTER}}",
  "STYLE LOCK: {{LOCK_STYLE}}",
  "COMPOSITION LOCK: {{LOCK_COMPOSITION}}",
  "NEGATIVE LOCK: {{NEGATIVE_CONSTRAINTS}}",
  "TEXT POLICY: {{NO_TEXT_POLICY}}",
  "QUALITY NOTES: avoid artifacts, preserve visual consistency, no text in frame.",
].join("\n");

const SCENE_TEMPLATES: Record<GoalTag, SceneTemplateSet> = {
  Texture: {
    goal: [
      "Показать фактуру и материал максимально читаемо",
      "Подчеркнуть рельеф поверхности без визуального шума",
      "Дать premium-ощущение через детали и микроконтраст",
    ],
    action: [
      "Главный объект статичен, акцент на поверхности и деталях",
      "Камера держит точный фокус на ключевой текстуре",
      "Плавный ритм кадра без динамического смаза",
    ],
    environment: [
      "Чистая студийная среда без лишних объектов",
      "Нейтральный фон с контролируемым контрастом",
      "Минималистичная локация с приоритетом на фактуру",
    ],
  },
  "Clean portrait": {
    goal: [
      "Собрать чистый коммерческий портрет без риска",
      "Сохранить натуральный тон кожи и предсказуемый результат",
      "Передать спокойный premium-портрет с читаемым лицом",
    ],
    action: [
      "Герой смотрит в камеру, поза спокойная и уверенная",
      "Лицо в фокусе, мимика естественная",
      "Минимальное движение для стабильной детализации",
    ],
    environment: [
      "Нейтральный интерьер с мягким объемом",
      "Чистый студийный фон без отвлекающих элементов",
      "Пространство с контролируемым светом и глубиной",
    ],
  },
  "Beauty gloss": {
    goal: [
      "Сделать глянцевый beauty-кадр с чистой кожей",
      "Подчеркнуть макияж и форму лица с premium look",
      "Собрать рекламный beauty-портрет для бренда",
    ],
    action: [
      "Герой в статичной beauty-позе, лицо в приоритете",
      "Аккуратный разворот головы для бликов и объема",
      "Четкий фокус на глазах и текстуре кожи",
    ],
    environment: [
      "Beauty-студия с нейтральным фоном",
      "Чистая площадка с контролем бликов",
      "Минимальный фон для акцента на лице",
    ],
  },
  "Cinematic drama": {
    goal: [
      "Передать кино-драму и объем света",
      "Собрать выразительный кадр с контрастом и глубиной",
      "Дать атмосферный cinematic look без потери читаемости",
    ],
    action: [
      "Герой в выразительной позе, акцент на эмоции",
      "Плавная динамика тела, но лицо остается читаемым",
      "Главный объект отделен от окружения светом",
    ],
    environment: [
      "Локация с глубиной и направленным светом",
      "Темноватый интерьер с контролем контраста",
      "Кинематографичная среда с атмосферой",
    ],
  },
  "Night mood": {
    goal: [
      "Передать ночную атмосферу и чистый контур",
      "Собрать темный mood без артефактов",
      "Получить читаемый ночной кадр с отделением героя",
    ],
    action: [
      "Герой статичен, акцент на силуэте и контуре",
      "Минимальные движения ради стабильного резкого кадра",
      "Главный объект выделен контровым светом",
    ],
    environment: [
      "Ночная городская среда с практическими источниками",
      "Темный фон с читаемыми световыми акцентами",
      "Blue-hour сцена с атмосферой",
    ],
  },
  Catalog: {
    goal: [
      "Собрать чистый каталожный кадр без сюрпризов",
      "Показать объект максимально понятно и ровно",
      "Получить безопасный коммерческий результат",
    ],
    action: [
      "Герой стоит в ровной позе, форма читается полностью",
      "Объект статичен, акцент на продукте",
      "Композиция стабильная, без лишней динамики",
    ],
    environment: [
      "Ровный нейтральный фон",
      "Студийная постановка с чистыми линиями",
      "Контролируемая среда без визуального шума",
    ],
  },
};

function createPreset(input: {
  id: string;
  category: CreatorCategory;
  goal: GoalTag;
  humanTitle: string;
  benefit: string;
  resultChips: string[];
  whyWorks: string[];
  defaults: TechSettings;
  sliderDefaults: SlidersMapping;
  recommended?: boolean;
  safeDefault?: boolean;
}): StudioTaskPreset {
  return {
    id: input.id,
    category: input.category,
    goal: input.goal,
    humanTitle: input.humanTitle,
    benefit: input.benefit,
    resultChips: input.resultChips,
    recommended: input.recommended ?? false,
    safeDefault: input.safeDefault ?? false,
    whyWorks: input.whyWorks,
    defaults: input.defaults,
    sliderDefaults: input.sliderDefaults,
    promptTemplateCompact: DEFAULT_PROMPT_TEMPLATE_COMPACT,
    promptTemplateFull: DEFAULT_PROMPT_TEMPLATE_FULL,
    locks: structuredClone(BASE_LOCKS),
    sceneTemplates: SCENE_TEMPLATES[input.goal],
  };
}

export const STUDIO_CAMERA_LIBRARY: StudioCatalogCamera[] = [
  {
    name: "Digital Full Frame",
    character: "Базовый современный full-frame: чисто, предсказуемо, универсально.",
    best_for: ["универсальная коммерция", "быстрый старт без риска", "контент на каждый день"],
    best_combo: {
      lens_profile: "Spherical Prime",
      focal_mm: 35,
      aperture: "f/2.8",
      light: "Мягкий ключ с деликатным заполнением",
    },
  },
  {
    name: "ARRI ALEXA Mini LF",
    character: "Кино-цвет, мягкий roll-off в светах, дорогой тон кожи.",
    best_for: ["портрет", "fashion-film эстетика", "премиальная реклама"],
    best_combo: {
      lens_profile: "Master Prime",
      focal_mm: 85,
      aperture: "f/2.0",
      light: "Rembrandt",
    },
  },
  {
    name: "RED V-RAPTOR 8K VV",
    character: "Высокая детализация и запас для кропа/поста; хорошо для VFX.",
    best_for: ["ночные сцены", "контрастные сцены", "дальние планы", "VFX-heavy"],
    best_combo: {
      lens_profile: "Telephoto Prime",
      focal_mm: 135,
      aperture: "f/2.8",
      light: "Blue hour ambient",
    },
  },
  {
    name: "Sony A1",
    character: "Быстрый гибрид с точным автофокусом и стабильной резкостью.",
    best_for: ["макро еды", "динамичная предметка", "коммерция в темпе"],
    best_combo: {
      lens_profile: "Macro 100mm",
      focal_mm: 100,
      aperture: "f/4",
      light: "Softbox overhead",
    },
  },
  {
    name: "Canon EOS R5",
    character: "Мягкий skin-tone и аккуратный контраст в портретах.",
    best_for: ["портрет", "beauty", "контент для брендов одежды"],
    best_combo: {
      lens_profile: "Spherical Prime",
      focal_mm: 50,
      aperture: "f/2.0",
      light: "Beauty dish frontal",
    },
  },
  {
    name: "Nikon Z8",
    character: "Плотная детализация и контроль текстур.",
    best_for: ["текстуры тканей", "предметка", "архитектурные детали"],
    best_combo: {
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/5.6",
      light: "Split lighting",
    },
  },
  {
    name: "Fujifilm GFX100 II",
    character: "Medium format пластика: плавные градиенты, чистые тона, премиальный микроконтраст.",
    best_for: ["fashion/beauty", "текстуры и материалы", "премиальная предметка", "крупные планы"],
    best_combo: {
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/5.6",
      light: "Split lighting",
    },
  },
  {
    name: "Hasselblad X2D 100C",
    character: "Натуральная цветопередача и спокойная тональность; отлично для skin-texture.",
    best_for: ["макро-портрет", "beauty-деталь", "текстура кожи/макияжа"],
    best_combo: {
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/4",
      light: "Butterfly / Paramount",
    },
  },
  {
    name: "Blackmagic URSA Mini Pro 12K",
    character: "Кино-ориентированная детализация и запас под пост/клинап.",
    best_for: ["постановочные сцены", "студийный продакшн", "multi-cam", "VFX/cleanup"],
    best_combo: {
      lens_profile: "Spherical Prime",
      focal_mm: 35,
      aperture: "f/2.8",
      light: "Кинематографичный направленный ключ",
    },
  },
];

export const STUDIO_LIGHT_SETUPS: LightSetupGuide[] = [
  {
    name: "Мягкий ключ с деликатным заполнением",
    best_for: ["универсальная коммерция", "лайфстайл", "чистый портрет"],
    microcopy: "Мягкий и безопасный свет для стабильной коммерции.",
  },
  {
    name: "Кинематографичный направленный ключ",
    best_for: ["кино-портрет", "драматургия", "премиальный объем"],
    microcopy: "Добавляет объем и кино-пластику без лишней жесткости.",
  },
  {
    name: "Контровой свет с плотным контрастом",
    best_for: ["силуэт", "отделение от фона", "ночной контраст"],
    microcopy: "Сильный контур и выразительная драма.",
  },
  {
    name: "Split lighting",
    best_for: ["текстуры ткани", "предметка", "фактура материала"],
    microcopy: "Side light to reveal texture.",
  },
  {
    name: "Rembrandt",
    best_for: ["премиальный портрет", "fashion-film", "объем"],
    microcopy: "Soft dramatic portrait shape.",
  },
  {
    name: "Softbox overhead",
    best_for: ["макро еда", "tabletop", "съемка сверху"],
    microcopy: "Even top light for food/flat-lay.",
  },
  {
    name: "Butterfly / Paramount",
    best_for: ["beauty", "макро-портрет", "глянец"],
    microcopy: "Ровный beauty-свет для лица и глянцевых задач.",
  },
  {
    name: "Beauty dish frontal",
    best_for: ["beauty", "портрет для брендов", "поп-глянец"],
    microcopy: "Контролируемые блики и чистая кожа в beauty-кадре.",
  },
];

export const STUDIO_TERM_GUIDE: ReferenceTerm[] = [
  {
    id: "focal-length",
    term: "Фокусное расстояние",
    what: "Насколько близко ощущается объект и как сжимается фон.",
    impact: "Меняет перспективу: широкий кадр или плотный портрет.",
    when: "24–35mm для среды, 85–105mm для портрета/деталей.",
    microcopy: "How close you feel + how much the background compresses.",
  },
  {
    id: "aperture",
    term: "Диафрагма",
    what: "Сколько зоны остается в фокусе.",
    impact: "Открытая диафрагма размывает фон, закрытая показывает детали.",
    when: "f/2.0 для отделения, f/5.6 для фактуры/каталога.",
    microcopy: "How much is in focus.",
  },
  {
    id: "split-light",
    term: "Split lighting",
    what: "Боковой свет, который подчеркивает рельеф.",
    impact: "Сильнее проявляет текстуры тканей и материалов.",
    when: "Используй для фактуры одежды, предметки, макро.",
    microcopy: "Side light to reveal texture.",
    applyValue: "Split lighting",
  },
  {
    id: "rembrandt",
    term: "Rembrandt",
    what: "Мягкий драматичный свет для портрета.",
    impact: "Добавляет объем лица и кино-настроение.",
    when: "Портреты, fashion-film, премиальный visual.",
    microcopy: "Soft dramatic portrait shape.",
    applyValue: "Rembrandt",
  },
  {
    id: "softbox-overhead",
    term: "Softbox overhead",
    what: "Ровный верхний мягкий свет.",
    impact: "Дает чистую, понятную картинку без грязных теней.",
    when: "Фуд-съемка, flat-lay, каталожная предметка.",
    microcopy: "Even top light for food/flat-lay.",
    applyValue: "Softbox overhead",
  },
];

export const STUDIO_TASK_PRESETS: StudioTaskPreset[] = [
  createPreset({
    id: "fashion_texture_01",
    category: "Fashion",
    goal: "Texture",
    humanTitle: "Текстуры одежды",
    benefit: "Швы, плетение и объем материала читаются максимально четко.",
    resultChips: ["Фактура", "Супер-детали", "Боковой свет", "Чистый фон"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["Split lighting проявляет рельеф ткани.", "f/5.6 удерживает швы в зоне резкости."],
    defaults: {
      camera: "Fujifilm GFX100 II",
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/5.6",
      lighting: "Split lighting",
    },
    sliderDefaults: {
      detail: 70,
      backgroundBlur: 40,
      lightDrama: 65,
    },
  }),
  createPreset({
    id: "fashion_catalog_01",
    category: "Fashion",
    goal: "Catalog",
    humanTitle: "Каталожка одежды",
    benefit: "Чистый коммерческий кадр: форма и цвет одежды без сюрпризов.",
    resultChips: ["Ровный свет", "Каталог", "Чистый фон", "Без риска"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["Мягкий ключ с заполнением дает стабильный коммерческий результат.", "f/5.6 сохраняет детали по всей одежде."],
    defaults: {
      camera: "Digital Full Frame",
      lens_profile: "Spherical Prime",
      focal_mm: 50,
      aperture: "f/5.6",
      lighting: "Мягкий ключ с деликатным заполнением",
    },
    sliderDefaults: { detail: 62, backgroundBlur: 34, lightDrama: 30 },
  }),
  createPreset({
    id: "people_clean_portrait_01",
    category: "People",
    goal: "Clean portrait",
    humanTitle: "Чистый портрет",
    benefit: "Натуральный портрет с предсказуемой кожей и мягкой пластикой.",
    resultChips: ["Портрет", "Натуральная кожа", "Мягкий свет", "Safe"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["50–85mm сохраняет пропорции лица.", "Мягкий свет снижает риск артефактов."],
    defaults: {
      camera: "Canon EOS R5",
      lens_profile: "Spherical Prime",
      focal_mm: 50,
      aperture: "f/2.8",
      lighting: "Мягкий ключ с деликатным заполнением",
    },
    sliderDefaults: { detail: 50, backgroundBlur: 58, lightDrama: 34 },
  }),
  createPreset({
    id: "people_beauty_gloss_01",
    category: "People",
    goal: "Beauty gloss",
    humanTitle: "Beauty gloss портрет",
    benefit: "Глянцевый beauty-кадр с контролируемыми бликами и чистой кожей.",
    resultChips: ["Beauty", "Глянец", "Чистая кожа", "Премиум"],
    recommended: true,
    safeDefault: false,
    whyWorks: ["Beauty-dish формирует аккуратный контраст.", "Портретный фокус отделяет лицо от фона."],
    defaults: {
      camera: "Hasselblad X2D 100C",
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/4",
      lighting: "Butterfly / Paramount",
    },
    sliderDefaults: { detail: 58, backgroundBlur: 74, lightDrama: 48 },
  }),
  createPreset({
    id: "people_night_01",
    category: "People",
    goal: "Night mood",
    humanTitle: "Ночной портрет",
    benefit: "Атмосферный ночной кадр с читаемым контуром и чистым лицом.",
    resultChips: ["Night", "Атмосфера", "Контур", "Контраст"],
    whyWorks: ["Контровой свет отделяет героя от фона.", "Теледиапазон усиливает cinematic compression."],
    defaults: {
      camera: "RED V-RAPTOR 8K VV",
      lens_profile: "Telephoto Prime",
      focal_mm: 135,
      aperture: "f/2.8",
      lighting: "Blue hour ambient",
    },
    sliderDefaults: { detail: 52, backgroundBlur: 76, lightDrama: 78 },
  }),
  createPreset({
    id: "food_macro_01",
    category: "Food",
    goal: "Texture",
    humanTitle: "Макро еда",
    benefit: "Фактура блюда крупным планом и чистая коммерческая подача.",
    resultChips: ["Еда", "Макро", "Фактура", "Чистый свет"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["Softbox overhead держит форму блюда ровно.", "Macro-оптика проявляет структуру ингредиентов."],
    defaults: {
      camera: "Sony A1",
      lens_profile: "Macro 100mm",
      focal_mm: 100,
      aperture: "f/4",
      lighting: "Softbox overhead",
    },
    sliderDefaults: { detail: 68, backgroundBlur: 24, lightDrama: 30 },
  }),
  createPreset({
    id: "food_catalog_01",
    category: "Food",
    goal: "Catalog",
    humanTitle: "Каталожная еда",
    benefit: "Ровная и безопасная подача блюда для меню и рекламы.",
    resultChips: ["Menu", "Чистый кадр", "Ровный свет", "Safe"],
    whyWorks: ["Мягкий свет делает цвета стабильными.", "f/5.6 удерживает блюдо в фокусе."],
    defaults: {
      camera: "Digital Full Frame",
      lens_profile: "Spherical Prime",
      focal_mm: 50,
      aperture: "f/5.6",
      lighting: "Softbox overhead",
    },
    sliderDefaults: { detail: 60, backgroundBlur: 20, lightDrama: 22 },
  }),
  createPreset({
    id: "product_packshot_01",
    category: "Product",
    goal: "Catalog",
    humanTitle: "Packshot продукта",
    benefit: "Чистый продуктовый кадр с максимальной читаемостью формы и материалов.",
    resultChips: ["Packshot", "Чистый фон", "Каталог", "Ровный свет"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["Закрытая диафрагма удерживает продукт целиком в резкости.", "Мягкий ключ дает чистые градиенты."],
    defaults: {
      camera: "Nikon Z8",
      lens_profile: "Macro 100mm",
      focal_mm: 105,
      aperture: "f/8",
      lighting: "Мягкий ключ с деликатным заполнением",
    },
    sliderDefaults: { detail: 74, backgroundBlur: 18, lightDrama: 26 },
  }),
  createPreset({
    id: "product_cinematic_01",
    category: "Product",
    goal: "Cinematic drama",
    humanTitle: "Герой-кадр продукта",
    benefit: "Выразительный hero-shot продукта с глубиной и контуром.",
    resultChips: ["Hero", "Контраст", "Объем", "Премиум"],
    whyWorks: ["Направленный ключ добавляет объем.", "Средний телевик усиливает разделение с фоном."],
    defaults: {
      camera: "Blackmagic URSA Mini Pro 12K",
      lens_profile: "Spherical Prime",
      focal_mm: 85,
      aperture: "f/4",
      lighting: "Кинематографичный направленный ключ",
    },
    sliderDefaults: { detail: 60, backgroundBlur: 62, lightDrama: 70 },
  }),
  createPreset({
    id: "interior_clean_01",
    category: "Interiors",
    goal: "Catalog",
    humanTitle: "Чистый интерьер",
    benefit: "Читабельный интерьер с аккуратной геометрией и натуральным светом.",
    resultChips: ["Интерьер", "Широкий кадр", "Чистые линии", "Каталог"],
    recommended: true,
    safeDefault: true,
    whyWorks: ["24–35mm показывает пространство без перегруза.", "Мягкий дневной свет сохраняет натуральность материалов."],
    defaults: {
      camera: "Nikon Z8",
      lens_profile: "Wide Prime",
      focal_mm: 24,
      aperture: "f/5.6",
      lighting: "Естественный свет через облачность",
    },
    sliderDefaults: { detail: 64, backgroundBlur: 14, lightDrama: 28 },
  }),
  createPreset({
    id: "interior_cinematic_01",
    category: "Interiors",
    goal: "Cinematic drama",
    humanTitle: "Кинематографичный интерьер",
    benefit: "Атмосферный интерьерный кадр с объемом и направленным светом.",
    resultChips: ["Интерьер", "Кино", "Объем", "Направленный свет"],
    whyWorks: ["Направленный ключ создает глубину плана.", "Широкий фокус удерживает архитектуру."],
    defaults: {
      camera: "ARRI ALEXA Mini LF",
      lens_profile: "Wide Prime",
      focal_mm: 35,
      aperture: "f/4",
      lighting: "Кинематографичный направленный ключ",
    },
    sliderDefaults: { detail: 58, backgroundBlur: 28, lightDrama: 62 },
  }),
];
