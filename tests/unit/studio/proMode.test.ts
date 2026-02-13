import { describe, expect, test } from "vitest";

import {
  DEFAULT_REQUIRED_NEGATIVE_LOCK,
  PRO_APERTURE_PRESETS,
  buildProPrompts,
  createDefaultProWizard,
  explainFocalLength,
  mapBlurSliderToAperture,
} from "@/lib/studio/proMode";

describe("createDefaultProWizard", () => {
  test("creates production-safe defaults with step 1", () => {
    const wizard = createDefaultProWizard();

    expect(wizard.step).toBe(1);
    expect(wizard.camera).toBe("Digital Full Frame");
    expect(wizard.locks.characterLock).toBe(true);
    expect(wizard.locks.styleLock).toBe(true);
    expect(wizard.locks.compositionLock).toBe(true);
    expect(wizard.locks.noTextStrict).toBe(true);
    expect(wizard.locks.negativeLock).toEqual(DEFAULT_REQUIRED_NEGATIVE_LOCK);
  });
});

describe("buildProPrompts", () => {
  test("includes required production-safe lines in compact and full output", () => {
    const wizard = createDefaultProWizard();

    wizard.camera = "ARRI ALEXA Mini LF";
    wizard.lens_profile = "Anamorphic";
    wizard.focal_mm = 85;
    wizard.aperture = "f/2.8";
    wizard.lighting_style = "Rembrandt";
    wizard.scene.goal = "Снять читабельный премиальный портрет для рекламного баннера.";
    wizard.scene.action = "Герой статичен, лицо в резком фокусе.";
    wizard.scene.environment = "Нейтральная локация с мягким отделением от фона.";

    const prompt = buildProPrompts(wizard);

    expect(prompt.compactPrompt).toContain("Nano Banana Pro Prompt");
    expect(prompt.compactPrompt).toContain("Intent: photoreal cinematic frame with production-safe clarity.");
    expect(prompt.compactPrompt).toContain("CAMERA FORMAT: ARRI ALEXA Mini LF");
    expect(prompt.compactPrompt).toContain("LENS/FOCAL/APERTURE: Anamorphic | 85mm | f/2.8");
    expect(prompt.compactPrompt).toContain("TEXT POLICY: NO-TEXT STRICT");

    expect(prompt.fullPrompt).toContain("SCENE GOAL: Снять читабельный премиальный портрет для рекламного баннера.");
    expect(prompt.fullPrompt).toContain("SCENE ACTION: Герой статичен, лицо в резком фокусе.");
    expect(prompt.fullPrompt).toContain("SCENE ENVIRONMENT: Нейтральная локация с мягким отделением от фона.");
    expect(prompt.fullPrompt).toContain("CHARACTER LOCK:");
    expect(prompt.fullPrompt).toContain("STYLE LOCK:");
    expect(prompt.fullPrompt).toContain("COMPOSITION LOCK:");
    expect(prompt.fullPrompt).toContain("NEGATIVE LOCK: no watermark, no text, no deformed faces/hands, no extra fingers, no artifacts");
  });
});

describe("aperture slider mapping", () => {
  test("maps blur side to open aperture and details side to closed aperture", () => {
    expect(PRO_APERTURE_PRESETS).toEqual(["f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"]);
    expect(mapBlurSliderToAperture(0)).toBe("f/2.0");
    expect(mapBlurSliderToAperture(25)).toBe("f/2.8");
    expect(mapBlurSliderToAperture(50)).toBe("f/4");
    expect(mapBlurSliderToAperture(76)).toBe("f/5.6");
    expect(mapBlurSliderToAperture(100)).toBe("f/8");
  });
});

describe("explainFocalLength", () => {
  test("returns readable RU explanations for focal chips", () => {
    expect(explainFocalLength(16)).toBe("широко, больше окружения");
    expect(explainFocalLength(24)).toBe("широко, больше окружения");
    expect(explainFocalLength(35)).toBe("репортажно-киношный универсал");
    expect(explainFocalLength(50)).toBe("натуральная перспектива");
    expect(explainFocalLength(85)).toBe("классический портрет");
    expect(explainFocalLength(105)).toBe("макро/детали и фактура");
    expect(explainFocalLength(135)).toBe("дальний, сильная компрессия");
    expect(explainFocalLength(200)).toBe("дальний, сильная компрессия");
  });
});
