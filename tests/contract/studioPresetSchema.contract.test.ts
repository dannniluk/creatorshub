import { describe, expect, test } from "vitest";

import { STUDIO_BEGINNER_PRESETS } from "@/lib/studio/catalog";
import { studioPresetCollectionSchema, studioPresetSchema } from "@/lib/studio/presetSchema";

describe("studio preset schema contract", () => {
  test("accepts valid beginner presets", () => {
    const parsed = studioPresetCollectionSchema.safeParse(STUDIO_BEGINNER_PRESETS);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.length).toBeGreaterThan(0);
  });

  test("rejects preset without humanTitle", () => {
    const parsed = studioPresetSchema.safeParse({
      id: "broken",
      category: "People",
      benefit: "desc",
      goalTags: ["Clean portrait"],
      recommended: false,
      safeDefault: false,
      whyThisWorks: ["why"],
      slidersMapping: { detail: 50, backgroundBlur: 50, lightDrama: 50 },
      techSettings: {
        camera_format: "Digital Full Frame",
        lens_type: "Spherical Prime",
        focal_length_mm: 50,
        aperture: "f/2.8",
        lighting_style: "Мягкий ключ с деликатным заполнением",
      },
      sceneSubject: "subject",
      sceneComposition: "composition",
      sceneEnvironment: "environment",
    });

    expect(parsed.success).toBe(false);
  });
});
