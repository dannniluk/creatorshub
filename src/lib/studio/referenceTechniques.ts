import type { TechSettings } from "@/lib/studio/catalog";

type TechniqueScenePatch = {
  goal?: string;
  action?: string;
  environment?: string;
};

type TechniqueLockedCorePatch = {
  character_lock?: string;
  style_lock?: string;
  composition_lock?: string;
};

export type ReferenceTechniqueDifficulty = "easy" | "medium" | "pro";

export type ReferenceRulePack = {
  id: string;
  title: string;
  summary: string;
  recommendations: string[];
  techPatch?: Partial<TechSettings>;
  scenePatch?: TechniqueScenePatch;
  lockedCorePatch?: TechniqueLockedCorePatch;
  negativeAdditions?: string[];
};

export type ReferenceTechniqueApply =
  | {
      kind: "partial-preset";
      patch: {
        presetId?: string;
        techPatch?: Partial<TechSettings>;
        scenePatch?: TechniqueScenePatch;
      };
    }
  | {
      kind: "rule-pack";
      pack: ReferenceRulePack;
    };

export type ReferenceTechnique = {
  id: string;
  title: string;
  description: string;
  difficulty: ReferenceTechniqueDifficulty;
  mood: string;
  genre: string;
  section: string;
  what: string;
  whenUse: string;
  whenAvoid: string;
  settingChanges: string[];
  apply: ReferenceTechniqueApply;
};

export const REFERENCE_DIFFICULTY_LABELS: Record<ReferenceTechniqueDifficulty, string> = {
  easy: "Просто",
  medium: "Средне",
  pro: "Pro",
};

export const REFERENCE_TECHNIQUES: ReferenceTechnique[] = [
  {
    id: "portrait-soft-key",
    title: "Мягкий портретный свет",
    description: "Спокойный коммерческий портрет с чистой кожей и мягкими тенями.",
    difficulty: "easy",
    mood: "Спокойно",
    genre: "Портрет",
    section: "Свет",
    what: "Мягкий источник света делает лицо ровным, а картинку предсказуемой.",
    whenUse: "Когда нужен безопасный портрет для бренда, карточки эксперта или личного профиля.",
    whenAvoid: "Если нужна жесткая драма и контрастные тени.",
    settingChanges: ["Свет: мягкий ключ с деликатным заполнением", "Диафрагма: f/2.8", "Фокусное: 50 мм"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "people_clean_portrait_01",
        techPatch: {
          lighting: "Мягкий ключ с деликатным заполнением",
          focal_mm: 50,
          aperture: "f/2.8",
        },
      },
    },
  },
  {
    id: "texture-side-light",
    title: "Фактура через боковой свет",
    description: "Подчеркивает рельеф ткани и материалов без лишнего шума.",
    difficulty: "easy",
    mood: "Четко",
    genre: "Мода",
    section: "Свет",
    what: "Боковой свет показывает объем и микрорельеф на поверхности.",
    whenUse: "Когда важно показать швы, плетение, фактуру упаковки или материала.",
    whenAvoid: "Если вам нужна мягкая, почти плоская подача без выраженного рельефа.",
    settingChanges: ["Свет: Split lighting", "Фокусное: 105 мм", "Диафрагма: f/5.6"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "fashion_texture_01",
        techPatch: {
          lighting: "Split lighting",
          focal_mm: 105,
          aperture: "f/5.6",
        },
      },
    },
  },
  {
    id: "catalog-safe",
    title: "Чистый каталог без риска",
    description: "Ровная подача товара, где форма и цвет читаются сразу.",
    difficulty: "easy",
    mood: "Нейтрально",
    genre: "Предметка",
    section: "Композиция",
    what: "Техника для понятной коммерческой картинки без лишних художественных эффектов.",
    whenUse: "Когда делаете карточки товара или меню с упором на читаемость.",
    whenAvoid: "Если нужна атмосферная история, а не точная карточка.",
    settingChanges: ["Диафрагма: f/5.6", "Свет: мягкий верхний", "Композиция: чистый центр"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "product_packshot_01",
        techPatch: {
          aperture: "f/5.6",
          lighting: "Мягкий ключ с деликатным заполнением",
          focal_mm: 50,
        },
      },
    },
  },
  {
    id: "focus-face-soft-bg",
    title: "Фокус на лице, фон мягче",
    description: "Удерживает лицо резким и аккуратно отделяет фон.",
    difficulty: "medium",
    mood: "Эмоционально",
    genre: "Портрет",
    section: "Фокус и размытость",
    what: "Комбинация умеренно длинного фокусного и открытой диафрагмы для портрета.",
    whenUse: "Когда нужен акцент на лице и приятная глубина резкости.",
    whenAvoid: "Если нужно, чтобы весь кадр был одинаково детализирован.",
    settingChanges: ["Фокусное: 85 мм", "Диафрагма: f/2.0", "Свет: Rembrandt"],
    apply: {
      kind: "rule-pack",
      pack: {
        id: "rp-focus-face-soft-bg",
        title: "Акцент на лице",
        summary: "Лицо остается в приоритете, фон становится мягче.",
        recommendations: [
          "Ставьте лицо как главный объект в центре внимания.",
          "Сохраняйте простое окружение, чтобы не спорить с фокусом.",
          "Проверьте, чтобы ключевые детали лица были в зоне резкости.",
        ],
        techPatch: {
          focal_mm: 85,
          aperture: "f/2.0",
          lighting: "Rembrandt",
        },
        scenePatch: {
          goal: "Главный акцент на лице, глубина резкости мягко отделяет фон.",
        },
        lockedCorePatch: {
          composition_lock: "Главный акцент на лице, без перегруженного фона.",
        },
      },
    },
  },
  {
    id: "cinema-rim-contrast",
    title: "Кинодраматичный контур",
    description: "Контровой свет и контраст для выразительного силуэта.",
    difficulty: "medium",
    mood: "Драма",
    genre: "Портрет",
    section: "Свет",
    what: "Техника отделяет объект от фона и добавляет ощущение глубины.",
    whenUse: "Когда нужен выразительный кадр для постера, тизера или обложки.",
    whenAvoid: "Если нужен ровный и мягкий свет без драматичного контраста.",
    settingChanges: ["Свет: контурный с контрастом", "Диафрагма: f/2.8", "Контраст в сцене выше"],
    apply: {
      kind: "rule-pack",
      pack: {
        id: "rp-cinema-rim-contrast",
        title: "Контур и драма",
        summary: "Больше объема и отделения объекта от фона.",
        recommendations: [
          "Оставляйте главный объект немного ярче фона.",
          "Старайтесь не перегружать кадр второстепенными деталями.",
          "Поддерживайте читаемый силуэт в ключевой позе.",
        ],
        techPatch: {
          lighting: "Контровой свет с плотным контрастом",
          aperture: "f/2.8",
        },
        scenePatch: {
          environment: "Фон темнее главного объекта, с четким отделением по свету.",
        },
        negativeAdditions: ["no flat lighting"],
      },
    },
  },
  {
    id: "night-silhouette",
    title: "Ночной акцент на силуэте",
    description: "Сохраняет атмосферу ночи и помогает не потерять главный объект.",
    difficulty: "medium",
    mood: "Ночь",
    genre: "Портрет",
    section: "Фокус и размытость",
    what: "Теледиапазон и открытая диафрагма дают чистый контур и отделение от фона.",
    whenUse: "Когда нужен ночной кадр с читаемым лицом или силуэтом.",
    whenAvoid: "Если снимаете светлый дневной каталог.",
    settingChanges: ["Фокусное: 135 мм", "Диафрагма: f/2.8", "Свет: Blue hour ambient"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "people_night_01",
        techPatch: {
          focal_mm: 135,
          aperture: "f/2.8",
          lighting: "Blue hour ambient",
        },
      },
    },
  },
  {
    id: "beauty-clean-skin",
    title: "Глянец без перегруза",
    description: "Помогает получить чистую кожу и аккуратные блики.",
    difficulty: "pro",
    mood: "Глянец",
    genre: "Портрет",
    section: "Свет",
    what: "Световая схема для beauty-кадра с контролем бликов и текстуры.",
    whenUse: "Когда снимаете косметику, портрет для кампании или премиальный лук.",
    whenAvoid: "Если нужна грубая фактура и «сырой» документальный стиль.",
    settingChanges: ["Свет: Butterfly / Paramount", "Фокусное: 105 мм", "Диафрагма: f/4"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "people_beauty_gloss_01",
        techPatch: {
          lighting: "Butterfly / Paramount",
          focal_mm: 105,
          aperture: "f/4",
        },
      },
    },
  },
  {
    id: "product-depth-control",
    title: "Глубина резкости под контроль",
    description: "Техника для баланса между читаемыми деталями и мягким фоном.",
    difficulty: "pro",
    mood: "Точно",
    genre: "Предметка",
    section: "Фокус и размытость",
    what: "Управляет глубиной резкости через осознанный выбор диафрагмы и фокусного.",
    whenUse: "Когда важно выделить главный элемент товара, но оставить читаемыми ключевые детали.",
    whenAvoid: "Если задача полностью художественная и не требует точной читаемости.",
    settingChanges: ["Диафрагма: f/4", "Фокусное: 85 мм", "Добавится правило на чистый фон"],
    apply: {
      kind: "rule-pack",
      pack: {
        id: "rp-product-depth-control",
        title: "Контроль глубины резкости",
        summary: "Главный объект выделяется, детали остаются читаемыми.",
        recommendations: [
          "Оставляйте главный объект ближе к центру и не перегружайте фон.",
          "Следите, чтобы ключевые детали товара были в зоне резкости.",
          "Используйте нейтральный фон для коммерческой читаемости.",
        ],
        techPatch: {
          focal_mm: 85,
          aperture: "f/4",
        },
        scenePatch: {
          action: "Главный объект статичен и полностью читаем по форме.",
        },
        lockedCorePatch: {
          style_lock: "Чистый коммерческий стиль, без визуальной перегрузки.",
        },
      },
    },
  },
  {
    id: "food-clean-overhead",
    title: "Чистая подача еды сверху",
    description: "Ровный свет и спокойная композиция для меню и рекламы.",
    difficulty: "easy",
    mood: "Тепло",
    genre: "Еда",
    section: "Композиция",
    what: "Свет сверху и простая раскладка помогают показать блюдо понятно и аккуратно.",
    whenUse: "Когда делаете меню, карточки блюда или рекламный баннер для еды.",
    whenAvoid: "Если хотите резкую драму с глубокими тенями.",
    settingChanges: ["Свет: Softbox overhead", "Фокусное: 100 мм", "Диафрагма: f/4"],
    apply: {
      kind: "partial-preset",
      patch: {
        presetId: "food_macro_01",
        techPatch: {
          lighting: "Softbox overhead",
          focal_mm: 100,
          aperture: "f/4",
        },
      },
    },
  },
];
