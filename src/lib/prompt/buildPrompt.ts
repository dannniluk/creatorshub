import type { PromptBuildInput } from "@/lib/domain/types";

export const PROMPT_BLOCK_ORDER = [
  "CHARACTER LOCK",
  "STYLE LOCK",
  "COMPOSITION LOCK",
  "NEGATIVE LOCK",
  "SCENE GOAL",
  "SCENE ACTION",
  "SCENE ENVIRONMENT",
  "LIGHTING",
  "TECHNIQUE",
  "TEXT POLICY",
] as const;

export function buildPrompt({ lockedCore, scene, technique }: PromptBuildInput): string {
  const techniqueLine = `${technique.name} | ${technique.category} | ${technique.cue}`;

  const blocks: Record<(typeof PROMPT_BLOCK_ORDER)[number], string> = {
    "CHARACTER LOCK": lockedCore.character_lock,
    "STYLE LOCK": lockedCore.style_lock,
    "COMPOSITION LOCK": lockedCore.composition_lock,
    "NEGATIVE LOCK": lockedCore.negative_lock,
    "SCENE GOAL": scene.goal,
    "SCENE ACTION": scene.action,
    "SCENE ENVIRONMENT": scene.environment,
    LIGHTING: scene.lighting,
    TECHNIQUE: techniqueLine,
    "TEXT POLICY": lockedCore.text_policy,
  };

  return PROMPT_BLOCK_ORDER.map((label) => `${label}: ${blocks[label].trim()}`).join("\n");
}
