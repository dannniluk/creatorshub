export type TextPolicy = "NO-TEXT STRICT" | "TEXT-ALLOWED";

export type LockedCore = {
  character_lock: string;
  style_lock: string;
  composition_lock: string;
  negative_lock: string;
  text_policy: TextPolicy;
};

export type SceneCard = {
  id: string;
  title: string;
  goal: string;
  action: string;
  environment: string;
  lighting: string;
  duration_hint: string;
};

export type TechniqueDifficulty = "easy" | "medium" | "hard";

export type Technique = {
  id: string;
  name: string;
  category: string;
  cue: string;
  difficulty: TechniqueDifficulty;
  example_image_url: string;
};

export type VariantControls = {
  camera: string;
  emotion: string;
  motion: string;
};

export type QcBreakdown = {
  character_consistency: number;
  composition_consistency: number;
  artifact_cleanliness: number;
  text_safety: number;
};

export type VariantStatus = "draft" | "pass" | "fail" | "best";

export type Variant = {
  id: string;
  run_id: string;
  seed: number;
  controls: VariantControls;
  prompt_text: string;
  qc_breakdown: QcBreakdown | null;
  qc_score: number | null;
  status: VariantStatus;
};

export type Run = {
  id: string;
  scene_id: string;
  technique_id: string;
  variant_count: number;
  created_at: string;
  best_variant_id: string | null;
  pass_threshold: number;
};

export type StoreData = {
  version: 1;
  locked_core: LockedCore;
  scenes: SceneCard[];
  techniques: Technique[];
  runs: Run[];
  variants: Variant[];
};

export type PromptBuildInput = {
  lockedCore: LockedCore;
  scene: SceneCard;
  technique: Technique;
};

export type GenerateVariantsInput = {
  runId: string;
  variantCount: number;
  lockedCore: LockedCore;
  scene: SceneCard;
  technique: Technique;
  baseSeed?: number;
};

export type QcScoreResult = {
  score: number;
  status: "pass" | "fail";
};
