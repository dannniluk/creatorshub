import { describe, expect, test } from "vitest";

import {
  buildLensProfileLabel,
  deriveLensRecommendations,
  getLensSeriesByType,
  LENS_TYPES,
  recommendLensTypeByContext,
  resolveLensTypeIdFromProfile,
} from "@/lib/studio/lensCatalog";

describe("lensCatalog", () => {
  test("contains editable lens type definitions", () => {
    expect(LENS_TYPES).toHaveLength(8);
    expect(LENS_TYPES.some((item) => item.id === "anamorphic")).toBe(true);
  });

  test("resolves type id from lens profile label", () => {
    expect(resolveLensTypeIdFromProfile("Spherical Prime")).toBe("spherical_prime");
    expect(resolveLensTypeIdFromProfile("Telephoto Prime • Leica Summicron-C (tele)")).toBe("tele");
  });

  test("derives filtered focals and defaults by type", () => {
    const result = deriveLensRecommendations({
      typeId: "wide",
      seriesId: null,
      availableFocals: [16, 24, 35, 50, 85, 105, 135, 200],
    });

    expect(result.focalOptions).toEqual([16, 24, 35]);
    expect(result.defaultFocal).toBe(24);
    expect(result.defaultAperture).toBe("f/4");
  });

  test("applies series bias to defaults and flare hints", () => {
    const result = deriveLensRecommendations({
      typeId: "anamorphic",
      seriesId: "anamorphic_atlas_orion",
      availableFocals: [16, 24, 35, 50, 85, 105, 135, 200],
    });

    expect(result.defaultFocal).toBe(50);
    expect(["f/2.0", "f/2.8", "f/4"]).toContain(result.defaultAperture);
    expect(result.copyHints.flareHint).toContain("матбокс");
  });

  test("builds lens profile label with optional series", () => {
    expect(buildLensProfileLabel("zoom_doc", null)).toBe("Zoom (doc)");
    expect(buildLensProfileLabel("zoom_doc", "zoom_angenieux_optimo")).toContain("Angenieux Optimo");
  });

  test("returns series list for lens type", () => {
    const series = getLensSeriesByType("clean_premium");
    expect(series.length).toBeGreaterThanOrEqual(3);
  });

  test("recommends lens type by category/goal context", () => {
    expect(recommendLensTypeByContext({ category: "Interiors", goal: "Catalog" })).toBe("wide");
    expect(recommendLensTypeByContext({ category: "People", goal: "Clean portrait" })).toBe("clean_premium");
    expect(recommendLensTypeByContext({ category: "Food", goal: "Texture" })).toBe("macro");
  });
});
