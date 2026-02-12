import { describe, expect, test } from "vitest";

import { mapSlidersToTech } from "@/lib/studio/sliderMapping";

describe("mapSlidersToTech", () => {
  test("prefers texture-safe lens when detail is high", () => {
    const result = mapSlidersToTech({
      base: {
        camera_format: "Sony A1",
        lens_type: "Spherical Prime",
        focal_length_mm: 50,
        aperture: "f/2.8",
        lighting_style: "Мягкий ключ с деликатным заполнением",
      },
      category: "Food",
      goal: "Texture",
      sliders: {
        detail: 90,
        backgroundBlur: 30,
        lightDrama: 55,
      },
    });

    expect(result.lens_type).toBe("Macro 100mm");
    expect(result.lighting_style).toBe("Split lighting");
  });

  test("maps high blur to tighter focal and wider aperture", () => {
    const result = mapSlidersToTech({
      base: {
        camera_format: "Digital Full Frame",
        lens_type: "Spherical Prime",
        focal_length_mm: 35,
        aperture: "f/4",
        lighting_style: "Мягкий ключ с деликатным заполнением",
      },
      category: "People",
      goal: "Clean portrait",
      sliders: {
        detail: 40,
        backgroundBlur: 85,
        lightDrama: 20,
      },
    });

    expect(result.focal_length_mm).toBeGreaterThanOrEqual(85);
    expect(result.aperture).toMatch(/f\/(1\.8|2\.0|2\.8)/);
  });

  test("maps high drama night mood to contrast lighting", () => {
    const result = mapSlidersToTech({
      base: {
        camera_format: "RED V-RAPTOR 8K VV",
        lens_type: "Spherical Prime",
        focal_length_mm: 50,
        aperture: "f/2.8",
        lighting_style: "Blue hour ambient",
      },
      category: "People",
      goal: "Night mood",
      sliders: {
        detail: 45,
        backgroundBlur: 60,
        lightDrama: 95,
      },
    });

    expect(result.lighting_style).toBe("Контровой свет с плотным контрастом");
  });
});
