import { describe, expect, test } from "vitest";

import { STUDIO_TASK_PRESETS } from "@/lib/studio/catalog";
import { mapSlidersToTech, sliderLevelLabel } from "@/lib/studio/sliderMapping";

describe("sliderLevelLabel", () => {
  test("returns low/medium/high labels", () => {
    expect(sliderLevelLabel(10)).toBe("Низко");
    expect(sliderLevelLabel(50)).toBe("Средне");
    expect(sliderLevelLabel(90)).toBe("Высоко");
  });
});

describe("mapSlidersToTech", () => {
  const base = STUDIO_TASK_PRESETS.find((item) => item.goal === "Clean portrait");

  if (!base) {
    throw new Error("clean portrait preset missing");
  }

  test("keeps defaults near middle values", () => {
    const mapped = mapSlidersToTech({
      base: base.defaults,
      category: base.category,
      goal: base.goal,
      sliders: { detail: 50, backgroundBlur: 50, lightDrama: 50 },
    });

    expect(mapped.aperture).toMatch(/f\/(2\.8|4)/);
    expect(mapped.focal_mm).toBeGreaterThanOrEqual(35);
    expect(mapped.focal_mm).toBeLessThanOrEqual(50);
  });

  test("uses high separation for high blur", () => {
    const mapped = mapSlidersToTech({
      base: base.defaults,
      category: base.category,
      goal: base.goal,
      sliders: { detail: 45, backgroundBlur: 90, lightDrama: 45 },
    });

    expect(mapped.focal_mm).toBeGreaterThanOrEqual(85);
    expect(mapped.aperture).toMatch(/f\/(2\.0|2\.8)/);
  });

  test("applies texture goal override", () => {
    const texturePreset = STUDIO_TASK_PRESETS.find((item) => item.goal === "Texture");
    if (!texturePreset) {
      throw new Error("texture preset missing");
    }

    const mapped = mapSlidersToTech({
      base: texturePreset.defaults,
      category: texturePreset.category,
      goal: texturePreset.goal,
      sliders: { detail: 70, backgroundBlur: 40, lightDrama: 75 },
    });

    expect(mapped.lighting).toBe("Split lighting");
    expect(mapped.focal_mm).toBeGreaterThanOrEqual(85);
    expect(mapped.focal_mm).toBeLessThanOrEqual(105);
    expect(mapped.aperture).toBe("f/5.6");
  });

  test("applies beauty goal override", () => {
    const beautyPreset = STUDIO_TASK_PRESETS.find((item) => item.goal === "Beauty gloss");
    if (!beautyPreset) {
      throw new Error("beauty preset missing");
    }

    const mapped = mapSlidersToTech({
      base: beautyPreset.defaults,
      category: beautyPreset.category,
      goal: beautyPreset.goal,
      sliders: { detail: 30, backgroundBlur: 80, lightDrama: 50 },
    });

    expect(["Butterfly / Paramount", "Beauty dish frontal"]).toContain(mapped.lighting);
    expect(mapped.focal_mm).toBeGreaterThanOrEqual(85);
    expect(mapped.focal_mm).toBeLessThanOrEqual(105);
  });
});
