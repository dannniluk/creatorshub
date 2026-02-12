import { describe, expect, test } from "vitest";

import { DEFAULT_GALLERY_PRESETS } from "@/lib/studio/presets";
import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import type { StudioSetup } from "@/lib/studio/types";

function makeSetup(): StudioSetup {
  const preset = DEFAULT_GALLERY_PRESETS[0];

  if (!preset) {
    throw new Error("Preset fixtures are required");
  }

  return {
    preset_id: preset.id,
    preset_title: preset.title,
    scene_goal: "Показать героя уверенным и собранным",
    scene_action: "Герой идет к камере сквозь легкий туман",
    scene_environment: "Промышленный док на рассвете",
    core6: { ...preset.core6_defaults },
    locked_core: { ...preset.locked_core_defaults },
  };
}

describe("generatePromptPack", () => {
  test("returns exactly six variants", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    expect(pack.variants).toHaveLength(6);
  });

  test("builds both provider prompt formats for every variant", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    for (const variant of pack.variants) {
      expect(variant.prompt_kling).toContain("Kling Prompt");
      expect(variant.prompt_nano).toContain("Nano Banana Pro Prompt");
    }
  });

  test("keeps locked core present in all variants", () => {
    const setup = makeSetup();
    setup.locked_core.character_lock = "Один и тот же актер, без замены лица";

    const pack = generatePromptPack({ setup });

    for (const variant of pack.variants) {
      expect(variant.prompt_kling).toContain("Один и тот же актер");
      expect(variant.prompt_nano).toContain("Один и тот же актер");
    }
  });

  test("keeps deterministic variant ids for identical setup", () => {
    const setup = makeSetup();

    const first = generatePromptPack({ setup });
    const second = generatePromptPack({ setup });

    expect(first.variants.map((item) => item.id)).toEqual(second.variants.map((item) => item.id));
  });
});
