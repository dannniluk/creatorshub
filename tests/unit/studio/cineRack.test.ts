import { describe, expect, test } from "vitest";

import { PRO_CAMERA_OPTIONS } from "@/lib/studio/proMode";
import { filterCineRackCameras, getRecommendedCameraLabels } from "@/lib/studio/cineRack";

describe("getRecommendedCameraLabels", () => {
  test("prefers social-first cameras for social speed brief", () => {
    const recommended = getRecommendedCameraLabels({
      categoryId: "social_content",
      primaryGoalId: "speed_simple",
    });

    expect(recommended).toContain("iPhone (Cinematic)");
    expect(recommended).toContain("Sony FX3");
  });

  test("prefers detail cameras for texture brief", () => {
    const recommended = getRecommendedCameraLabels({
      categoryId: "texture_material",
      primaryGoalId: "texture_clarity",
    });

    expect(recommended).toContain("RED V-RAPTOR 8K VV");
    expect(recommended).toContain("Nikon Z8");
  });

  test("returns stable default list when no brief data", () => {
    const recommended = getRecommendedCameraLabels({
      categoryId: "",
      primaryGoalId: "",
    });

    expect(recommended.length).toBeGreaterThanOrEqual(3);
    expect(recommended).toContain("Digital Full Frame");
  });
});

describe("filterCineRackCameras", () => {
  test("returns all cameras for all filter", () => {
    const filtered = filterCineRackCameras({
      cameras: PRO_CAMERA_OPTIONS,
      filter: "all",
      recommendedLabels: ["Sony FX3"],
      savedLabels: [],
    });

    expect(filtered).toHaveLength(PRO_CAMERA_OPTIONS.length);
  });

  test("returns only recommended cameras for recommended filter", () => {
    const filtered = filterCineRackCameras({
      cameras: PRO_CAMERA_OPTIONS,
      filter: "recommended",
      recommendedLabels: ["Sony FX3", "iPhone (Cinematic)"],
      savedLabels: [],
    });

    expect(filtered.map((item) => item.label)).toEqual(["Sony FX3", "iPhone (Cinematic)"]);
  });

  test("returns only saved cameras for saved filter", () => {
    const filtered = filterCineRackCameras({
      cameras: PRO_CAMERA_OPTIONS,
      filter: "saved",
      recommendedLabels: [],
      savedLabels: ["ARRI ALEXA Mini LF", "Canon EOS R5"],
    });

    expect(filtered.map((item) => item.label)).toEqual(["ARRI ALEXA Mini LF", "Canon EOS R5"]);
  });
});
