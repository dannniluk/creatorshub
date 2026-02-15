import type { ProCameraOption } from "@/lib/studio/proMode";

export type CineRackCameraFilter = "all" | "recommended" | "saved";

type CameraRecommendationInput = {
  categoryId: string;
  primaryGoalId: string;
};

type RecommendationRule = {
  keywords: string[];
  cameras: string[];
};

const DEFAULT_RECOMMENDED_CAMERAS = ["Digital Full Frame", "ARRI ALEXA Mini LF", "Sony A1"];

const CATEGORY_RULES: RecommendationRule[] = [
  {
    keywords: ["social", "content"],
    cameras: ["iPhone (Cinematic)", "Sony FX3", "Fujifilm X-H2S"],
  },
  {
    keywords: ["portrait", "beauty"],
    cameras: ["ARRI ALEXA Mini LF", "Canon EOS R5", "Hasselblad X2D 100C"],
  },
  {
    keywords: ["product", "marketplace", "macro", "texture", "tech", "jewelry", "medical"],
    cameras: ["RED V-RAPTOR 8K VV", "Nikon Z8", "Sony A1"],
  },
  {
    keywords: ["interior", "architecture"],
    cameras: ["Digital Full Frame", "Sony FX6", "Panasonic LUMIX S5 II"],
  },
  {
    keywords: ["hero", "banner", "ad"],
    cameras: ["ARRI ALEXA Mini LF", "Blackmagic URSA Mini Pro 12K", "Sony FX6"],
  },
  {
    keywords: ["food"],
    cameras: ["Canon EOS R5", "Nikon Z8", "Fujifilm GFX100 II"],
  },
];

const GOAL_RULES: RecommendationRule[] = [
  {
    keywords: ["speed", "simple"],
    cameras: ["iPhone (Cinematic)", "Sony FX3", "Fujifilm X-H2S"],
  },
  {
    keywords: ["texture", "detail"],
    cameras: ["RED V-RAPTOR 8K VV", "Nikon Z8", "Blackmagic URSA Mini Pro 12K"],
  },
  {
    keywords: ["premium", "gloss"],
    cameras: ["ARRI ALEXA Mini LF", "Fujifilm GFX100 II", "Hasselblad X2D 100C"],
  },
  {
    keywords: ["clean", "color", "accuracy", "legibility"],
    cameras: ["Digital Full Frame", "Sony A1", "Canon EOS R5"],
  },
];

function matchRules(value: string, rules: readonly RecommendationRule[]): string[] {
  if (!value.trim()) {
    return [];
  }

  const normalized = value.toLowerCase();
  const result: string[] = [];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      result.push(...rule.cameras);
    }
  }

  return result;
}

export function getRecommendedCameraLabels(input: CameraRecommendationInput): string[] {
  const byCategory = matchRules(input.categoryId, CATEGORY_RULES);
  const byGoal = matchRules(input.primaryGoalId, GOAL_RULES);

  return Array.from(new Set([...byCategory, ...byGoal, ...DEFAULT_RECOMMENDED_CAMERAS]));
}

type FilterInput = {
  cameras: readonly ProCameraOption[];
  filter: CineRackCameraFilter;
  recommendedLabels: readonly string[];
  savedLabels: readonly string[];
};

export function filterCineRackCameras(input: FilterInput): ProCameraOption[] {
  if (input.filter === "all") {
    return [...input.cameras];
  }

  if (input.filter === "recommended") {
    const recommended = new Set(input.recommendedLabels);
    return input.cameras.filter((camera) => recommended.has(camera.label));
  }

  const saved = new Set(input.savedLabels);
  return input.cameras.filter((camera) => saved.has(camera.label));
}
