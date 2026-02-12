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
  camera_format: string;
  lens_type: string;
  focal_length_mm: number;
  aperture: string;
  lighting_style: string;
};

export type StudioPreset = {
  id: string;
  category: CreatorCategory;
  humanTitle: string;
  benefit: string;
  goalTags: GoalTag[];
  recommended: boolean;
  safeDefault: boolean;
  whyThisWorks: string[];
  slidersMapping: SlidersMapping;
  techSettings: TechSettings;
  sceneSubject: string;
  sceneComposition: string;
  sceneEnvironment: string;
};

export type StudioCatalogCamera = {
  name: string;
  character: string;
  best_for: string[];
  best_combo: TechSettings;
};

export type LightSetupGuide = {
  name: string;
  plainMeaning: string;
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

export const STUDIO_CAMERA_LIBRARY: StudioCatalogCamera[] = [
  {
    name: "Digital Full Frame",
    character: "Базовый современный full-frame: чисто, предсказуемо, универсально.",
    best_for: ["универсальная коммерция", "быстрый старт без риска", "контент на каждый день"],
    best_combo: {
      camera_format: "Digital Full Frame",
      lens_type: "Spherical Prime",
      focal_length_mm: 35,
      aperture: "f/2.8",
      lighting_style: "Мягкий ключ с деликатным заполнением",
    },
  },
  {
    name: "ARRI ALEXA Mini LF",
    character: "Кино-цвет, мягкий roll-off в светах, дорогой тон кожи.",
    best_for: ["портрет", "fashion-film эстетика", "премиальная реклама"],
    best_combo: {
      camera_format: "ARRI ALEXA Mini LF",
      lens_type: "Master Prime",
      focal_length_mm: 85,
      aperture: "f/2.0",
      lighting_style: "Rembrandt",
    },
  },
  {
    name: "RED V-RAPTOR 8K VV",
    character: "Высокая детализация и запас для кропа/поста; хорошо для VFX.",
    best_for: ["ночные сцены", "контрастные сцены", "дальние планы", "VFX-heavy"],
    best_combo: {
      camera_format: "RED V-RAPTOR 8K VV",
      lens_type: "Telephoto Prime",
      focal_length_mm: 135,
      aperture: "f/2.8",
      lighting_style: "Blue hour ambient",
    },
  },
  {
    name: "Sony A1",
    character: "Быстрый гибрид с точным автофокусом и стабильной резкостью.",
    best_for: ["макро еды", "динамичная предметка", "коммерция в темпе"],
    best_combo: {
      camera_format: "Sony A1",
      lens_type: "Macro 100mm",
      focal_length_mm: 100,
      aperture: "f/4",
      lighting_style: "Softbox overhead",
    },
  },
  {
    name: "Canon EOS R5",
    character: "Мягкий skin-tone и аккуратный контраст в портретах.",
    best_for: ["портрет", "beauty", "контент для брендов одежды"],
    best_combo: {
      camera_format: "Canon EOS R5",
      lens_type: "Spherical Prime",
      focal_length_mm: 50,
      aperture: "f/2.0",
      lighting_style: "Beauty dish frontal",
    },
  },
  {
    name: "Nikon Z8",
    character: "Плотная детализация и контроль текстур.",
    best_for: ["текстуры тканей", "предметка", "архитектурные детали"],
    best_combo: {
      camera_format: "Nikon Z8",
      lens_type: "Macro 100mm",
      focal_length_mm: 105,
      aperture: "f/5.6",
      lighting_style: "Split lighting",
    },
  },
  {
    name: "Fujifilm GFX100 II",
    character: "Medium format пластика: плавные градиенты, чистые тона, премиальный микроконтраст.",
    best_for: ["fashion/beauty", "текстуры и материалы", "премиальная предметка", "крупные планы"],
    best_combo: {
      camera_format: "Fujifilm GFX100 II",
      lens_type: "Macro 100mm",
      focal_length_mm: 105,
      aperture: "f/5.6",
      lighting_style: "Split lighting",
    },
  },
  {
    name: "Hasselblad X2D 100C",
    character: "Натуральная цветопередача и спокойная тональность; отлично для skin-texture.",
    best_for: ["макро-портрет", "beauty-деталь", "текстура кожи/макияжа"],
    best_combo: {
      camera_format: "Hasselblad X2D 100C",
      lens_type: "Macro 100mm",
      focal_length_mm: 105,
      aperture: "f/4",
      lighting_style: "Butterfly / Paramount",
    },
  },
  {
    name: "Blackmagic URSA Mini Pro 12K",
    character: "Кино-ориентированная детализация и запас под пост/клинап.",
    best_for: ["постановочные сцены", "студийный продакшн", "multi-cam", "VFX/cleanup"],
    best_combo: {
      camera_format: "Blackmagic URSA Mini Pro 12K",
      lens_type: "Spherical Prime",
      focal_length_mm: 35,
      aperture: "f/2.8",
      lighting_style: "Кинематографичный направленный ключ",
    },
  },
];

export const STUDIO_LIGHT_SETUPS: LightSetupGuide[] = [
  {
    name: "Split lighting",
    plainMeaning: "Side light to reveal texture.",
  },
  {
    name: "Rembrandt",
    plainMeaning: "Soft dramatic portrait shape.",
  },
  {
    name: "Softbox overhead",
    plainMeaning: "Even top light for food/flat-lay.",
  },
  {
    name: "Мягкий ключ с деликатным заполнением",
    plainMeaning: "Мягкий равномерный свет для безопасного коммерческого результата.",
  },
  {
    name: "Кинематографичный направленный ключ",
    plainMeaning: "Более объемный кино-свет с контролируемыми тенями.",
  },
  {
    name: "Контровой свет с плотным контрастом",
    plainMeaning: "Сильный контур и более драматичный контраст.",
  },
  {
    name: "Beauty dish frontal",
    plainMeaning: "Ровный beauty-свет для лица и кожи.",
  },
];

export const STUDIO_BEGINNER_PRESETS: StudioPreset[] = [
  {
    id: "fashion-safe-catalog",
    category: "Fashion",
    humanTitle: "Fashion catalog safe",
    benefit: "Чистый и стабильный вид одежды без риска по коже и фактуре. Подходит для ежедневной коммерции.",
    goalTags: ["Catalog", "Clean portrait"],
    recommended: true,
    safeDefault: true,
    whyThisWorks: [
      "Средний фокус сохраняет натуральные пропорции модели.",
      "Мягкий свет уменьшает шум и артефакты на ткани.",
    ],
    slidersMapping: { detail: 58, backgroundBlur: 45, lightDrama: 32 },
    techSettings: {
      camera_format: "Digital Full Frame",
      lens_type: "Spherical Prime",
      focal_length_mm: 50,
      aperture: "f/4",
      lighting_style: "Мягкий ключ с деликатным заполнением",
    },
    sceneSubject: "Модель в каталожной позе, одежда читается полностью",
    sceneComposition: "Чистый фронтальный кадр, ровная геометрия, без визуального шума",
    sceneEnvironment: "Нейтральная студия с чистым фоном",
  },
  {
    id: "fashion-beauty-gloss",
    category: "Fashion",
    humanTitle: "Beauty gloss portrait",
    benefit: "Глянцевый портрет с аккуратным контрастом и контролем бликов. Хорошо для beauty-брендов.",
    goalTags: ["Beauty gloss", "Clean portrait"],
    recommended: true,
    safeDefault: false,
    whyThisWorks: [
      "Портретный фокус помогает отделить лицо от фона.",
      "Beauty light подчеркивает форму лица без лишней жесткости.",
    ],
    slidersMapping: { detail: 55, backgroundBlur: 72, lightDrama: 52 },
    techSettings: {
      camera_format: "Canon EOS R5",
      lens_type: "Spherical Prime",
      focal_length_mm: 85,
      aperture: "f/2.0",
      lighting_style: "Beauty dish frontal",
    },
    sceneSubject: "Крупный beauty-портрет с фокусом на коже и макияже",
    sceneComposition: "Голова и плечи, спокойная поза, чистый центр кадра",
    sceneEnvironment: "Студийный фон без отвлекающих объектов",
  },
  {
    id: "people-clean-safe",
    category: "People",
    humanTitle: "Clean portrait safe",
    benefit: "Натуральный портрет с мягкой пластикой лица и предсказуемым результатом для массового контента.",
    goalTags: ["Clean portrait", "Catalog"],
    recommended: true,
    safeDefault: true,
    whyThisWorks: [
      "Умеренный фокус не искажает лицо.",
      "Мягкий свет уменьшает риск жестких теней и артефактов.",
    ],
    slidersMapping: { detail: 50, backgroundBlur: 55, lightDrama: 36 },
    techSettings: {
      camera_format: "Digital Full Frame",
      lens_type: "Spherical Prime",
      focal_length_mm: 50,
      aperture: "f/2.8",
      lighting_style: "Мягкий ключ с деликатным заполнением",
    },
    sceneSubject: "Один герой в кадре с уверенным спокойным выражением",
    sceneComposition: "Средний крупный план, взгляд в камеру, чистый фон",
    sceneEnvironment: "Нейтральная интерьерная среда",
  },
  {
    id: "people-cinematic-drama",
    category: "People",
    humanTitle: "Cinematic drama portrait",
    benefit: "Более киношный и эмоциональный портрет с объемным светом, но без потери читаемости.",
    goalTags: ["Cinematic drama", "Night mood"],
    recommended: false,
    safeDefault: false,
    whyThisWorks: [
      "Кино-камера дает мягкий тон кожи и объем.",
      "Направленный ключ добавляет драму без грязного шума.",
    ],
    slidersMapping: { detail: 48, backgroundBlur: 66, lightDrama: 68 },
    techSettings: {
      camera_format: "ARRI ALEXA Mini LF",
      lens_type: "Master Prime",
      focal_length_mm: 85,
      aperture: "f/2.0",
      lighting_style: "Rembrandt",
    },
    sceneSubject: "Герой в эмоциональном портрете с акцентом на взгляд",
    sceneComposition: "Плотный портрет, чистый контур лица, контролируемая глубина",
    sceneEnvironment: "Темный интерьер с читаемым фоном",
  },
  {
    id: "food-safe-overhead",
    category: "Food",
    humanTitle: "Food top-shot safe",
    benefit: "Ровный и понятный food-кадр для меню и рекламы. Быстрый старт без сложной настройки.",
    goalTags: ["Catalog", "Texture"],
    recommended: true,
    safeDefault: true,
    whyThisWorks: [
      "Верхний мягкий свет делает блюдо чистым и читаемым.",
      "Контроль глубины помогает сохранить детали ингредиентов.",
    ],
    slidersMapping: { detail: 72, backgroundBlur: 22, lightDrama: 28 },
    techSettings: {
      camera_format: "Sony A1",
      lens_type: "Macro 100mm",
      focal_length_mm: 100,
      aperture: "f/4",
      lighting_style: "Softbox overhead",
    },
    sceneSubject: "Блюдо сверху с акцентом на форму и цвет",
    sceneComposition: "Чистый top shot, главный объект по центру",
    sceneEnvironment: "Фуд-стол с нейтральной поверхностью",
  },
  {
    id: "food-texture-macro",
    category: "Food",
    humanTitle: "Food macro texture",
    benefit: "Показывает фактуру и свежесть ингредиентов крупным планом для премиального вида.",
    goalTags: ["Texture", "Cinematic drama"],
    recommended: false,
    safeDefault: false,
    whyThisWorks: [
      "Macro-оптика подчеркивает структуру блюда.",
      "Боковой свет раскрывает текстуру поверхности.",
    ],
    slidersMapping: { detail: 84, backgroundBlur: 62, lightDrama: 62 },
    techSettings: {
      camera_format: "Sony A1",
      lens_type: "Macro 100mm",
      focal_length_mm: 105,
      aperture: "f/5.6",
      lighting_style: "Split lighting",
    },
    sceneSubject: "Крупный план фактуры блюда",
    sceneComposition: "Плотная макро-композиция с одним центром внимания",
    sceneEnvironment: "Студийная фуд-среда с минималистичным фоном",
  },
  {
    id: "product-safe-packshot",
    category: "Product",
    humanTitle: "Product packshot safe",
    benefit: "Чистая предметка с контролем бликов и стабильной геометрией. Подходит для e-commerce.",
    goalTags: ["Catalog", "Texture"],
    recommended: true,
    safeDefault: true,
    whyThisWorks: [
      "Средний фокус убирает геометрические искажения.",
      "Мягкий ключ делает продукт чистым и коммерческим.",
    ],
    slidersMapping: { detail: 74, backgroundBlur: 30, lightDrama: 34 },
    techSettings: {
      camera_format: "Digital Full Frame",
      lens_type: "Spherical Prime",
      focal_length_mm: 50,
      aperture: "f/5.6",
      lighting_style: "Мягкий ключ с деликатным заполнением",
    },
    sceneSubject: "Один продукт в кадре с четкой формой",
    sceneComposition: "Центральный packshot без лишних объектов",
    sceneEnvironment: "Чистый студийный фон",
  },
  {
    id: "product-jewelry-texture",
    category: "Product",
    humanTitle: "Jewelry texture macro",
    benefit: "Детализированная фактура металла и камней для премиальной ювелирной подачи.",
    goalTags: ["Texture", "Beauty gloss"],
    recommended: false,
    safeDefault: false,
    whyThisWorks: [
      "Macro и более закрытая диафрагма удерживают мелкие детали в фокусе.",
      "Side light добавляет графичность поверхности.",
    ],
    slidersMapping: { detail: 88, backgroundBlur: 36, lightDrama: 64 },
    techSettings: {
      camera_format: "Nikon Z8",
      lens_type: "Macro 100mm",
      focal_length_mm: 105,
      aperture: "f/8",
      lighting_style: "Split lighting",
    },
    sceneSubject: "Ювелирный объект крупным планом",
    sceneComposition: "Макро-кадр с акцентом на главный элемент",
    sceneEnvironment: "Темный чистый фон с контролируемыми бликами",
  },
  {
    id: "interiors-safe-daylight",
    category: "Interiors",
    humanTitle: "Interior daylight safe",
    benefit: "Читаемый интерьерный кадр с естественной геометрией и мягким дневным тоном.",
    goalTags: ["Catalog", "Clean portrait"],
    recommended: true,
    safeDefault: true,
    whyThisWorks: [
      "Широкий фокус показывает пространство без перегиба.",
      "Облачный свет сохраняет натуральность и чистоту.",
    ],
    slidersMapping: { detail: 68, backgroundBlur: 18, lightDrama: 25 },
    techSettings: {
      camera_format: "Nikon Z8",
      lens_type: "Wide Prime",
      focal_length_mm: 24,
      aperture: "f/5.6",
      lighting_style: "Естественный свет через облачность",
    },
    sceneSubject: "Интерьер с четкой архитектурой и одним визуальным акцентом",
    sceneComposition: "Широкий фронтальный кадр с прямыми вертикалями",
    sceneEnvironment: "Дневной интерьер, чистый и аккуратный",
  },
  {
    id: "interiors-night-mood",
    category: "Interiors",
    humanTitle: "Interior night mood",
    benefit: "Атмосферный ночной интерьер с читаемым контуром и безопасным уровнем контраста.",
    goalTags: ["Night mood", "Cinematic drama"],
    recommended: false,
    safeDefault: false,
    whyThisWorks: [
      "Практический свет сохраняет правдоподобие сцены.",
      "Контурный акцент отделяет главный объект от темного фона.",
    ],
    slidersMapping: { detail: 52, backgroundBlur: 48, lightDrama: 78 },
    techSettings: {
      camera_format: "RED V-RAPTOR 8K VV",
      lens_type: "Spherical Prime",
      focal_length_mm: 35,
      aperture: "f/2.8",
      lighting_style: "Практические источники в кадре",
    },
    sceneSubject: "Интерьерный сюжет с ночным настроением",
    sceneComposition: "Средний план, главный объект четко отделен",
    sceneEnvironment: "Ночной интерьер с мотивированными источниками света",
  },
];
