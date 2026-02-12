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

function createPreset(mood: string, shotType: string, index: number): GalleryPreset {
  const shotKey = shotType.toLowerCase();

  return {
    id: `${mood.toLowerCase().replaceAll(" ", "-")}-${shotKey}`,
    title: `${mood} • ${shotType}`,
    mood,
    shot_type: shotType,
    image_url: `https://picsum.photos/seed/cinema-${index}/1000/1300`,
    description: `Референс для настроения «${mood}» с типом кадра «${shotType}».`,
    tags: [mood, shotType, "Cinema Studio"],
    core6_defaults: {
      camera_format: mood === "Clean Commercial" ? "Digital Full Frame" : "Classic 16mm Film",
      lens_type: mood === "Cinematic Drama" ? "Anamorphic" : "Spherical Prime",
      focal_length_mm: FOCAL_BY_SHOT[shotKey] ?? 35,
      aperture: mood === "Gritty Urban" ? "f/4" : "f/2.8",
      lighting_style: mood === "Warm Lifestyle" ? "Soft warm key with gentle fill" : "Directional cinematic key",
      camera_movement: shotType === "Establishing" ? "Slow push-in" : "Subtle handheld drift",
    },
    locked_core_defaults: { ...BASE_LOCKED_CORE },
    example_prompts: {
      kling: `Kling Prompt\nMood: ${mood}\nShot: ${shotType}\nSubject: Уверенный герой в естественной драматичной среде.`,
      nano: `Nano Banana Pro Prompt\nMood: ${mood}\nShot: ${shotType}\nIntent: Фотореалистичный кадр с кинематографичной глубиной.`,
    },
  };
}

const MOODS = ["Clean Commercial", "Warm Lifestyle", "Gritty Urban", "Cinematic Drama"];
const SHOTS = ["Establishing", "Portrait", "Detail"];

export const DEFAULT_GALLERY_PRESETS: GalleryPreset[] = MOODS.flatMap((mood, moodIndex) =>
  SHOTS.map((shot, shotIndex) => createPreset(mood, shot, moodIndex * SHOTS.length + shotIndex + 1)),
);
