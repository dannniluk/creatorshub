import type { VariantControls } from "@/lib/domain/types";

export function applyControls(basePrompt: string, controls: VariantControls): string {
  return [
    basePrompt,
    "VARIATION CONTROLS:",
    `CAMERA: ${controls.camera}`,
    `EMOTION: ${controls.emotion}`,
    `MOTION: ${controls.motion}`,
  ].join("\n");
}
