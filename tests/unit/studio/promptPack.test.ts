import { describe, expect, test } from "vitest";

import { STUDIO_TASK_PRESETS } from "@/lib/studio/catalog";
import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import type { StudioSetup } from "@/lib/studio/types";

function makeSetup(): StudioSetup {
  const preset = STUDIO_TASK_PRESETS[0];

  if (!preset) {
    throw new Error("Preset fixtures are required");
  }

  return {
    preset_id: preset.id,
    preset_title: preset.humanTitle,
    scene_goal: preset.sceneTemplates.goal[0] ?? "",
    scene_action: preset.sceneTemplates.action[0] ?? "",
    scene_environment: preset.sceneTemplates.environment[0] ?? "",
    core6: {
      camera_format: preset.defaults.camera,
      lens_type: preset.defaults.lens_profile,
      focal_length_mm: preset.defaults.focal_mm,
      aperture: preset.defaults.aperture,
      lighting_style: preset.defaults.lighting,
      camera_movement: "Статичный кадр",
    },
    locked_core: {
      character_lock: "Один и тот же главный герой",
      style_lock: "Кинематографичный реализм",
      composition_lock: "Чистая композиция",
      negative_lock: "no watermark, no text, no deformed faces/hands, no extra fingers, no artifacts",
      text_policy: "NO-TEXT STRICT",
    },
    meta: {
      category: preset.category,
      goal: preset.goal,
      human_title: preset.humanTitle,
      benefit: preset.benefit,
      result_chips: preset.resultChips,
      why_works: preset.whyWorks,
    },
  };
}

describe("generatePromptPack", () => {
  test("returns exactly four variants", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    expect(pack.variants).toHaveLength(4);
  });

  test("builds production-safe prompt format", () => {
    const pack = generatePromptPack({ setup: makeSetup() });
    const prompt = pack.variants[0]?.prompt_nano ?? "";

    expect(prompt).toContain("INTENT:");
    expect(prompt).toContain("SUBJECT:");
    expect(prompt).toContain("COMPOSITION:");
    expect(prompt).toContain("ENVIRONMENT:");
    expect(prompt).toContain("CAMERA EMULATION:");
    expect(prompt).toContain("LIGHTING:");
    expect(prompt).toContain("LOCKS:");
    expect(prompt).toContain("NEGATIVE CONSTRAINTS:");
    expect(prompt).toContain("TEXT POLICY: NO-TEXT STRICT");
  });

  test("always keeps required negative constraints", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    for (const variant of pack.variants) {
      expect(variant.prompt_nano).toContain("no watermark");
      expect(variant.prompt_nano).toContain("no text");
      expect(variant.prompt_nano).toContain("no deformed faces/hands");
      expect(variant.prompt_nano).toContain("no extra fingers");
      expect(variant.prompt_nano).toContain("no artifacts");
    }
  });
});
