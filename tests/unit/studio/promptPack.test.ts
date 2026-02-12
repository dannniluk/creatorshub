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
  test("returns base prompt plus three variants", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    expect(pack.variants).toHaveLength(4);
  });

  test("builds production-safe prompt structure for every variant", () => {
    const pack = generatePromptPack({ setup: makeSetup() });

    for (const variant of pack.variants) {
      expect(variant.prompt_nano).toContain("Nano Banana Pro Prompt");
      expect(variant.prompt_nano).toContain("INTENT:");
      expect(variant.prompt_nano).toContain("SUBJECT:");
      expect(variant.prompt_nano).toContain("COMPOSITION:");
      expect(variant.prompt_nano).toContain("ENVIRONMENT:");
      expect(variant.prompt_nano).toContain("CAMERA EMULATION:");
      expect(variant.prompt_nano).toContain("LIGHTING:");
      expect(variant.prompt_nano).toContain("LOCKS:");
      expect(variant.prompt_nano).toContain("NEGATIVE CONSTRAINTS:");
      expect(variant.prompt_nano).toContain("TEXT POLICY: NO-TEXT STRICT");
      expect(variant.prompt_nano).toContain("no watermark, no text, no deformed faces/hands, no extra fingers, no artifacts");
    }
  });

  test("keeps locked core present in all variants", () => {
    const setup = makeSetup();
    setup.locked_core.character_lock = "Один и тот же актер, без замены лица";

    const pack = generatePromptPack({ setup });

    for (const variant of pack.variants) {
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
