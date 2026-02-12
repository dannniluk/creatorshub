import { describe, expect, test } from "vitest";

import { scoreQc } from "@/lib/qc/scoreQc";

describe("scoreQc", () => {
  test("computes weighted score and pass status", () => {
    const result = scoreQc(
      {
        character_consistency: 5,
        composition_consistency: 4,
        artifact_cleanliness: 4,
        text_safety: 5,
      },
      80,
    );

    expect(result.score).toBe(90);
    expect(result.status).toBe("pass");
  });

  test("returns fail below threshold", () => {
    const result = scoreQc(
      {
        character_consistency: 2,
        composition_consistency: 2,
        artifact_cleanliness: 2,
        text_safety: 2,
      },
      80,
    );

    expect(result.score).toBe(40);
    expect(result.status).toBe("fail");
  });
});
