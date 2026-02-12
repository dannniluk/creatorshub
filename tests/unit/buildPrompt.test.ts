import { describe, expect, test } from "vitest";

import { applyControls } from "@/lib/prompt/applyControls";
import { buildPrompt, PROMPT_BLOCK_ORDER } from "@/lib/prompt/buildPrompt";
import { generateVariants } from "@/lib/prompt/generateVariants";
import { DEFAULT_LOCKED_CORE } from "@/lib/domain/defaults";

const scene = {
  id: "scene_a",
  title: "Arrival",
  goal: "Reveal the protagonist",
  action: "Walks through fog toward camera",
  environment: "Wet alley at dawn",
  lighting: "Soft side light",
  duration_hint: "4s",
};

const technique = {
  id: "tech_a",
  name: "Cinematic realism",
  category: "camera",
  cue: "anamorphic lens flare",
  difficulty: "medium" as const,
  example_image_url: "",
};

describe("buildPrompt", () => {
  test("keeps exact block order", () => {
    const prompt = buildPrompt({
      lockedCore: {
        ...DEFAULT_LOCKED_CORE,
        character_lock: "same actor",
        style_lock: "35mm grain",
        composition_lock: "headroom stable",
        negative_lock: "no text",
      },
      scene,
      technique,
    });

    const lines = prompt.split("\n");
    const labels = lines.map((line) => line.split(":")[0]);
    expect(labels).toEqual(PROMPT_BLOCK_ORDER);
  });

  test("applyControls appends only control block", () => {
    const basePrompt = buildPrompt({ lockedCore: DEFAULT_LOCKED_CORE, scene, technique });
    const result = applyControls(basePrompt, {
      camera: "medium",
      emotion: "focused",
      motion: "slow push",
    });

    expect(result.startsWith(basePrompt)).toBe(true);
    expect(result).toContain("VARIATION CONTROLS:");
    expect(result).toContain("CAMERA: medium");
    expect(result).toContain("EMOTION: focused");
    expect(result).toContain("MOTION: slow push");
  });
});

describe("generateVariants", () => {
  test("is deterministic for same run and base seed", () => {
    const input = {
      runId: "run_fixed",
      variantCount: 12,
      lockedCore: { ...DEFAULT_LOCKED_CORE, character_lock: "same actor" },
      scene,
      technique,
      baseSeed: 1234,
    };

    const left = generateVariants(input);
    const right = generateVariants(input);

    expect(left).toEqual(right);
    expect(left).toHaveLength(12);
    expect(left[0]?.id).toBe("run_fixed_v1");
  });
});
