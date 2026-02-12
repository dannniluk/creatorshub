import type { LockedCore } from "@/lib/domain/types";

import type { GalleryPreset } from "@/lib/studio/types";

const BASE_LOCKED_CORE: LockedCore = {
  character_lock: "Один и тот же главный герой во всех кадрах, стабильная внешность и возраст.",
  style_lock: "Кинематографичный реализм, чистая фактура, без стилизации под 3D/аниме.",
  composition_lock: "Четкий главный объект, читаемая глубина плана, без визуального шума.",
  negative_lock: "без деформаций лица, без лишних пальцев, без артефактов, без watermark",
  text_policy: "NO-TEXT STRICT",
};

const FOCAL_BY_SHOT: Record<string, number> = {
  establishing: 24,
  portrait: 50,
  detail: 85,
};

function createPreset(mood: string, category: string, shotType: string, index: number): GalleryPreset {
  const shotKey = shotType.toLowerCase();

  return {
    id: `${mood.toLowerCase().replaceAll(" ", "-")}-${shotKey}`,
    title: `${mood} • ${shotType}`,
    mood,
    shot_type: shotType,
    category,
    image_url: `https://picsum.photos/seed/cinema-${index}/1000/1300`,
    description: `Референс для настроения «${mood}» с типом кадра «${shotType}».`,
    tags: [mood, shotType, category, "Cinema Studio"],
    core6_defaults: {
      camera_format: mood === "Clean Commercial" ? "Sony A1" : "ARRI ALEXA Mini LF",
      lens_type: mood === "Cinematic Drama" ? "Anamorphic Prime" : "Spherical Prime",
      focal_length_mm: FOCAL_BY_SHOT[shotKey] ?? 35,
      aperture: mood === "Gritty Urban" ? "f/4" : "f/2.8",
      lighting_style: mood === "Warm Lifestyle" ? "Мягкий ключ с деликатным заполнением" : "Кинематографичный направленный ключ",
      camera_movement: shotType === "Establishing" ? "Медленный наезд" : "Мягкий handheld",
    },
    locked_core_defaults: { ...BASE_LOCKED_CORE },
    example_prompts: {
      nano: `Nano Banana Pro Prompt\nMood: ${mood}\nShot: ${shotType}\nIntent: Фотореалистичный кадр с кинематографичной глубиной.`,
    },
  };
}

const MOOD_CONFIGS = [
  { mood: "Clean Commercial", category: "Мода" },
  { mood: "Warm Lifestyle", category: "Люди" },
  { mood: "Gritty Urban", category: "Люди" },
  { mood: "Cinematic Drama", category: "Люди" },
  { mood: "Noir Night", category: "Мода" },
  { mood: "Dreamy Pastel", category: "Еда" },
  { mood: "Documentary Natural", category: "Медицина" },
  { mood: "Editorial Minimal", category: "Еда" },
];
const SHOTS = ["Establishing", "Portrait", "Detail"];

export const DEFAULT_GALLERY_PRESETS: GalleryPreset[] = MOOD_CONFIGS.flatMap((item, moodIndex) =>
  SHOTS.map((shot, shotIndex) => createPreset(item.mood, item.category, shot, moodIndex * SHOTS.length + shotIndex + 1)),
);
