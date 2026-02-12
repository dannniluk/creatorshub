import { z } from "zod";

export const textPolicySchema = z.enum(["NO-TEXT STRICT", "TEXT-ALLOWED"]);

export const lockedCoreSchema = z.object({
  character_lock: z.string(),
  style_lock: z.string(),
  composition_lock: z.string(),
  negative_lock: z.string(),
  text_policy: textPolicySchema,
});

export const sceneCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  action: z.string().min(1),
  environment: z.string().min(1),
  lighting: z.string().min(1),
  duration_hint: z.string().min(1),
});

export const techniqueDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const techniqueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  cue: z.string().min(1),
  difficulty: techniqueDifficultySchema,
  example_image_url: z.string().url().or(z.literal("")),
});

export const variantControlsSchema = z.object({
  camera: z.string().min(1),
  emotion: z.string().min(1),
  motion: z.string().min(1),
});

export const qcBreakdownSchema = z.object({
  character_consistency: z.number().min(0).max(5),
  composition_consistency: z.number().min(0).max(5),
  artifact_cleanliness: z.number().min(0).max(5),
  text_safety: z.number().min(0).max(5),
});

export const variantStatusSchema = z.enum(["draft", "pass", "fail", "best"]);

export const variantSchema = z.object({
  id: z.string().min(1),
  run_id: z.string().min(1),
  seed: z.number().int().nonnegative(),
  controls: variantControlsSchema,
  prompt_text: z.string().min(1),
  qc_breakdown: qcBreakdownSchema.nullable(),
  qc_score: z.number().min(0).max(100).nullable(),
  status: variantStatusSchema,
});

export const runSchema = z.object({
  id: z.string().min(1),
  scene_id: z.string().min(1),
  technique_id: z.string().min(1),
  variant_count: z.number().int().min(1).max(24),
  created_at: z.string().datetime(),
  best_variant_id: z.string().min(1).nullable(),
  pass_threshold: z.number().min(0).max(100),
});

export const storeDataSchema = z.object({
  version: z.literal(1),
  locked_core: lockedCoreSchema,
  scenes: z.array(sceneCardSchema),
  techniques: z.array(techniqueSchema),
  runs: z.array(runSchema),
  variants: z.array(variantSchema),
});

export const createSceneSchema = sceneCardSchema.omit({ id: true });
export const updateSceneSchema = sceneCardSchema;

export const createTechniqueSchema = techniqueSchema.omit({ id: true });
export const updateTechniqueSchema = techniqueSchema;

export const generateRunSchema = z.object({
  scene_id: z.string().min(1),
  technique_id: z.string().min(1),
  variant_count: z.number().int().min(1).max(24).optional(),
  pass_threshold: z.number().min(0).max(100).optional(),
  base_seed: z.number().int().nonnegative().optional(),
});

export const updateQcSchema = z.object({
  qc_breakdown: qcBreakdownSchema,
  threshold: z.number().min(0).max(100).optional(),
});

export const markBestSchema = z.object({
  variant_id: z.string().min(1),
});
