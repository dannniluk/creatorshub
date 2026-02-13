import { describe, expect, test } from "vitest";

import { STUDIO_TASK_PRESETS } from "@/lib/studio/catalog";
import { studioPresetCollectionSchema, studioPresetSchema } from "@/lib/studio/presetSchema";

describe("studio preset schema", () => {
  test("validates complete preset collection", () => {
    const parsed = studioPresetCollectionSchema.safeParse(STUDIO_TASK_PRESETS);
    expect(parsed.success).toBe(true);
  });

  test("rejects missing required human layer fields", () => {
    const sample = structuredClone(STUDIO_TASK_PRESETS[0]!);
    // @ts-expect-error test invalid payload
    delete sample.humanTitle;

    const parsed = studioPresetSchema.safeParse(sample);
    expect(parsed.success).toBe(false);
  });
});
