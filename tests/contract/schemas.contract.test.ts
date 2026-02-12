import { describe, expect, test } from "vitest";

import {
  lockedCoreSchema,
  runSchema,
  sceneCardSchema,
  storeDataSchema,
  techniqueSchema,
  variantSchema,
} from "@/lib/domain/schemas";

describe("domain contracts", () => {
  test("rejects invalid scene structure", () => {
    const parsed = sceneCardSchema.safeParse({
      id: "scene_1",
      title: "Missing fields",
    });

    expect(parsed.success).toBe(false);
  });

  test("accepts valid api-shaped payloads", () => {
    const lockedCore = lockedCoreSchema.parse({
      character_lock: "same actor",
      style_lock: "cinematic",
      composition_lock: "centered",
      negative_lock: "no watermark",
      text_policy: "NO-TEXT STRICT",
    });

    const scene = sceneCardSchema.parse({
      id: "scene_1",
      title: "Launch",
      goal: "Show launch",
      action: "Run toward frame",
      environment: "Hangar",
      lighting: "Backlit",
      duration_hint: "4s",
    });

    const technique = techniqueSchema.parse({
      id: "tech_1",
      name: "Hero Shot",
      category: "camera",
      cue: "s-curve dolly",
      difficulty: "medium",
      example_image_url: "",
    });

    const run = runSchema.parse({
      id: "run_1",
      scene_id: scene.id,
      technique_id: technique.id,
      variant_count: 12,
      created_at: "2026-02-12T10:00:00.000Z",
      best_variant_id: null,
      pass_threshold: 80,
    });

    const variant = variantSchema.parse({
      id: "run_1_v1",
      run_id: run.id,
      seed: 12345,
      controls: {
        camera: "medium",
        emotion: "focused",
        motion: "slow push",
      },
      prompt_text: "CHARACTER LOCK: same actor",
      qc_breakdown: null,
      qc_score: null,
      status: "draft",
    });

    const store = storeDataSchema.parse({
      version: 1,
      locked_core: lockedCore,
      scenes: [scene],
      techniques: [technique],
      runs: [run],
      variants: [variant],
    });

    expect(store.runs[0]?.id).toBe("run_1");
    expect(store.variants[0]?.id).toBe("run_1_v1");
  });
});
