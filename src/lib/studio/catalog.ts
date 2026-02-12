export type CameraCombo = {
  lens_profile: string;
  focal_mm: number;
  aperture: string;
  light: string;
};

export type StudioCatalogCamera = {
  name: string;
  character: string;
  best_for: string[];
  best_combo: CameraCombo;
};

export type StudioTaskPreset = {
  id: string;
  task: string;
  category: "Люди" | "Мода" | "Еда" | "Медицина";
  description: string;
  camera: string;
  lens_profile: string;
  focal_mm: number;
  aperture: string;
  light: string;
};

export type FocalLengthGuide = {
  label: string;
  use: string[];
};

export type LightSetupGuide = {
  name: string;
  best_for: string[];
};

export const STUDIO_CATEGORIES = ["Все", "Люди", "Мода", "Еда", "Медицина"] as const;

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

export const STUDIO_FOCAL_LENGTH_GUIDE: FocalLengthGuide[] = [
  { label: "14-20 мм", use: ["архитектура", "establishing", "драматичная перспектива"] },
  { label: "24 мм", use: ["широкие планы", "интерьеры", "окружение героя"] },
  { label: "35 мм", use: ["сторителлинг", "лайфстайл", "репортажный кино-look"] },
  { label: "50 мм", use: ["универсал", "натуральные пропорции", "предметка без искажений"] },
  { label: "85 мм", use: ["классический портрет", "премиальный look", "separation"] },
  { label: "100-105 мм", use: ["макро", "детали", "еда", "beauty-кроп"] },
  { label: "135 мм", use: ["дальний план", "компрессия", "телепортрет"] },
  { label: "200+ мм", use: ["спорт/сцена", "стрит издалека", "сильная компрессия"] },
];

export const STUDIO_LIGHT_SETUPS: LightSetupGuide[] = [
  { name: "Мягкий ключ с деликатным заполнением", best_for: ["универсальная коммерция", "лайфстайл", "чистый портрет"] },
  { name: "Кинематографичный направленный ключ", best_for: ["кино-портрет", "драматургия", "премиальный объем"] },
  { name: "Контровой свет с плотным контрастом", best_for: ["силуэт", "отделение от фона", "ночной контраст"] },
  { name: "Естественный свет через облачность", best_for: ["натуральный lifestyle", "дневной контент"] },
  { name: "Практические источники в кадре", best_for: ["night mood", "интерьер", "мотивированный свет"] },
  { name: "Butterfly / Paramount", best_for: ["beauty", "макро-портрет", "глянец"] },
  { name: "Rembrandt", best_for: ["премиальный портрет", "fashion-film", "объем"] },
  { name: "Split lighting", best_for: ["текстуры ткани", "предметка", "фактура материала"] },
  { name: "Golden hour backlight", best_for: ["outdoor портрет", "fashion на улице", "романтика"] },
  { name: "Blue hour ambient", best_for: ["ночной mood", "дальний план", "атмосфера"] },
  { name: "Softbox overhead", best_for: ["макро еда", "tabletop", "съемка сверху"] },
  { name: "Beauty dish frontal", best_for: ["beauty", "портрет для брендов", "поп-глянец"] },
];

export const STUDIO_TASK_PRESETS: StudioTaskPreset[] = [
  {
    id: "food-macro",
    task: "Макро еда",
    category: "Еда",
    description: "Фактура блюда крупным планом, чистая коммерция.",
    camera: "Sony A1",
    lens_profile: "Macro 100mm",
    focal_mm: 100,
    aperture: "f/4",
    light: "Softbox overhead",
  },
  {
    id: "fabric-texture",
    task: "Текстуры одежды",
    category: "Мода",
    description: "Ткани, швы и объем материала, максимальная читаемость фактуры.",
    camera: "Fujifilm GFX100 II",
    lens_profile: "Macro 100mm",
    focal_mm: 105,
    aperture: "f/5.6",
    light: "Split lighting",
  },
  {
    id: "portrait",
    task: "Портрет",
    category: "Люди",
    description: "Чистый крупный портрет с кино-пластикой.",
    camera: "ARRI ALEXA Mini LF",
    lens_profile: "Master Prime",
    focal_mm: 85,
    aperture: "f/2.0",
    light: "Rembrandt",
  },
  {
    id: "macro-portrait",
    task: "Макро портрет",
    category: "Люди",
    description: "Скин-текстура и бьюти-деталь без лишней жесткости.",
    camera: "Hasselblad X2D 100C",
    lens_profile: "Macro 100mm",
    focal_mm: 105,
    aperture: "f/4",
    light: "Butterfly / Paramount",
  },
  {
    id: "night-distance",
    task: "Ночной дальний",
    category: "Люди",
    description: "Темная сцена с дальним планом, атмосфера сумерек.",
    camera: "RED V-RAPTOR 8K VV",
    lens_profile: "Telephoto Prime",
    focal_mm: 135,
    aperture: "f/2.8",
    light: "Blue hour ambient",
  },
  {
    id: "studio-interview",
    task: "Интервью в студии",
    category: "Люди",
    description: "Кино-интервью: мягкий объем, контролируемые тени, премиальный тон кожи.",
    camera: "Blackmagic URSA Mini Pro 12K",
    lens_profile: "Spherical Prime",
    focal_mm: 50,
    aperture: "f/2.8",
    light: "Кинематографичный направленный ключ",
  },
  {
    id: "fashion-catalog",
    task: "Каталожка одежды на модели",
    category: "Мода",
    description: "Чисто, ровно, без сюрпризов: цвета и детали читаются стабильно.",
    camera: "Digital Full Frame",
    lens_profile: "Spherical Prime",
    focal_mm: 50,
    aperture: "f/4",
    light: "Мягкий ключ с деликатным заполнением",
  },
  {
    id: "beauty-gloss",
    task: "Beauty (глянцевый портрет)",
    category: "Мода",
    description: "Ровная кожа, аккуратный контраст, контролируемые блики.",
    camera: "Canon EOS R5",
    lens_profile: "Spherical Prime",
    focal_mm: 85,
    aperture: "f/2.0",
    light: "Beauty dish frontal",
  },
  {
    id: "jewelry-macro",
    task: "Украшения / ювелирка макро",
    category: "Мода",
    description: "Максимум фактуры металла/камней, графичный объем.",
    camera: "Nikon Z8",
    lens_profile: "Macro 100mm",
    focal_mm: 105,
    aperture: "f/8",
    light: "Split lighting",
  },
  {
    id: "cosmetics-packshot",
    task: "Косметика packshot (премиум)",
    category: "Мода",
    description: "Чистый премиальный продукт с мягкими градиентами и контролем бликов.",
    camera: "Fujifilm GFX100 II",
    lens_profile: "Macro 100mm",
    focal_mm: 105,
    aperture: "f/8",
    light: "Мягкий ключ с деликатным заполнением",
  },
  {
    id: "hero-product-contrast",
    task: "Предметка герой-кадр (high-contrast)",
    category: "Еда",
    description: "Отделение от фона, выразительный контур и глубина.",
    camera: "Digital Full Frame",
    lens_profile: "Spherical Prime",
    focal_mm: 85,
    aperture: "f/4",
    light: "Контровой свет с плотным контрастом",
  },
  {
    id: "lifestyle-day",
    task: "Лайфстайл портрет днем",
    category: "Люди",
    description: "Натуральный дневной портрет, мягкие градиенты, естественная кожа.",
    camera: "Canon EOS R5",
    lens_profile: "Spherical Prime",
    focal_mm: 50,
    aperture: "f/2.8",
    light: "Естественный свет через облачность",
  },
  {
    id: "outdoor-fashion-golden",
    task: "Outdoor fashion на закате",
    category: "Мода",
    description: "Теплый контровой, воздушная картинка, романтика и объем.",
    camera: "ARRI ALEXA Mini LF",
    lens_profile: "Spherical Prime",
    focal_mm: 50,
    aperture: "f/2.8",
    light: "Golden hour backlight",
  },
  {
    id: "neon-city-portrait",
    task: "Портрет в неоне / в городе",
    category: "Люди",
    description: "Ночной портрет с атмосферой, свет мотивирован окружением.",
    camera: "RED V-RAPTOR 8K VV",
    lens_profile: "Spherical Prime",
    focal_mm: 35,
    aperture: "f/2.0",
    light: "Практические источники в кадре",
  },
  {
    id: "wide-interior-architecture",
    task: "Архитектура интерьер (широкий)",
    category: "Медицина",
    description: "Читаемость пространства, аккуратные линии, естественный вид.",
    camera: "Nikon Z8",
    lens_profile: "Wide Prime",
    focal_mm: 24,
    aperture: "f/5.6",
    light: "Естественный свет через облачность",
  },
  {
    id: "cinema-broll-details",
    task: "Кино-b-roll (детали рук/объектов)",
    category: "Люди",
    description: "Кино-детали с направленным объемом и контролем фона.",
    camera: "ARRI ALEXA Mini LF",
    lens_profile: "Spherical Prime",
    focal_mm: 35,
    aperture: "f/2.8",
    light: "Кинематографичный направленный ключ",
  },
  {
    id: "dynamic-product",
    task: "Динамичная предметка (в темпе)",
    category: "Еда",
    description: "Быстрое движение, надежная резкость и контроль деталей.",
    camera: "Sony A1",
    lens_profile: "Spherical Prime",
    focal_mm: 35,
    aperture: "f/2.8",
    light: "Мягкий ключ с деликатным заполнением",
  },
  {
    id: "outdoor-sport-action",
    task: "Спорт / экшен на улице",
    category: "Люди",
    description: "Сильное отделение, энергия, объем за счет контрового и солнца.",
    camera: "Sony A1",
    lens_profile: "Telephoto Prime",
    focal_mm: 135,
    aperture: "f/2.8",
    light: "Golden hour backlight",
  },
  {
    id: "fashion-flatlay",
    task: "Флетлей fashion (вид сверху)",
    category: "Мода",
    description: "Ровная раскладка одежды/аксессуаров сверху, чистая коммерция.",
    camera: "Sony A1",
    lens_profile: "Spherical Prime",
    focal_mm: 35,
    aperture: "f/4",
    light: "Softbox overhead",
  },
  {
    id: "night-silhouette",
    task: "Ночной силуэт / контур",
    category: "Люди",
    description: "Графичный контур и драматичный контраст, герой отделен от фона.",
    camera: "RED V-RAPTOR 8K VV",
    lens_profile: "Spherical Prime",
    focal_mm: 50,
    aperture: "f/2.8",
    light: "Контровой свет с плотным контрастом",
  },
];
