import { z } from "zod";

import { BEGINNER_CATEGORIES, BEGINNER_GOALS } from "@/lib/studio/catalog";

const categoryValues = [...BEGINNER_CATEGORIES] as [
  (typeof BEGINNER_CATEGORIES)[number],
  ...(typeof BEGINNER_CATEGORIES)[number][],
];

const goalValues = [...BEGINNER_GOALS] as [
  (typeof BEGINNER_GOALS)[number],
  ...(typeof BEGINNER_GOALS)[number][],
];

export const slidersMappingSchema = z.object({
  detail: z.number().min(0).max(100),
  backgroundBlur: z.number().min(0).max(100),
  lightDrama: z.number().min(0).max(100),
});

export const techSettingsSchema = z.object({
  camera: z.string().min(2),
  lens_profile: z.string().min(2),
  focal_mm: z.number().int().min(14).max(300),
  aperture: z.string().min(2),
  lighting: z.string().min(2),
});

export const sceneTemplateSchema = z.object({
  goal: z.array(z.string().min(5)).min(1),
  action: z.array(z.string().min(5)).min(1),
  environment: z.array(z.string().min(5)).min(1),
});

export const presetLocksSchema = z.object({
  characterLock: z.boolean(),
  styleLock: z.boolean(),
  compositionLock: z.boolean(),
  noTextStrict: z.boolean(),
  negativeLock: z.array(z.string().min(2)).min(5),
});

export const studioPresetSchema = z.object({
  id: z.string().min(3),
  category: z.enum(categoryValues),
  goal: z.enum(goalValues),
  humanTitle: z.string().min(3),
  benefit: z.string().min(10),
  resultChips: z.array(z.string().min(2)).min(3).max(8),
  recommended: z.boolean(),
  safeDefault: z.boolean(),
  whyWorks: z.array(z.string().min(4)).min(1).max(2),
  defaults: techSettingsSchema,
  sliderDefaults: slidersMappingSchema,
  promptTemplate: z.string().min(8),
  locks: presetLocksSchema,
  sceneTemplates: sceneTemplateSchema,
});

export const studioPresetCollectionSchema = z.array(studioPresetSchema);

export const STUDIO_PRESET_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Prompt Copilot Task Preset",
  type: "object",
  required: [
    "id",
    "category",
    "goal",
    "humanTitle",
    "benefit",
    "resultChips",
    "recommended",
    "safeDefault",
    "whyWorks",
    "defaults",
    "sliderDefaults",
    "promptTemplate",
    "locks",
    "sceneTemplates",
  ],
  properties: {
    id: { type: "string", minLength: 3 },
    category: { type: "string", enum: BEGINNER_CATEGORIES },
    goal: { type: "string", enum: BEGINNER_GOALS },
    humanTitle: { type: "string", minLength: 3 },
    benefit: { type: "string", minLength: 10 },
    resultChips: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string", minLength: 2 },
    },
    recommended: { type: "boolean" },
    safeDefault: { type: "boolean" },
    whyWorks: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string", minLength: 4 },
    },
    defaults: {
      type: "object",
      required: ["camera", "lens_profile", "focal_mm", "aperture", "lighting"],
      properties: {
        camera: { type: "string", minLength: 2 },
        lens_profile: { type: "string", minLength: 2 },
        focal_mm: { type: "integer", minimum: 14, maximum: 300 },
        aperture: { type: "string", minLength: 2 },
        lighting: { type: "string", minLength: 2 },
      },
      additionalProperties: false,
    },
    sliderDefaults: {
      type: "object",
      required: ["detail", "backgroundBlur", "lightDrama"],
      properties: {
        detail: { type: "number", minimum: 0, maximum: 100 },
        backgroundBlur: { type: "number", minimum: 0, maximum: 100 },
        lightDrama: { type: "number", minimum: 0, maximum: 100 },
      },
      additionalProperties: false,
    },
    promptTemplate: { type: "string", minLength: 8 },
    locks: {
      type: "object",
      required: ["characterLock", "styleLock", "compositionLock", "noTextStrict", "negativeLock"],
      properties: {
        characterLock: { type: "boolean" },
        styleLock: { type: "boolean" },
        compositionLock: { type: "boolean" },
        noTextStrict: { type: "boolean" },
        negativeLock: {
          type: "array",
          minItems: 5,
          items: { type: "string", minLength: 2 },
        },
      },
      additionalProperties: false,
    },
    sceneTemplates: {
      type: "object",
      required: ["goal", "action", "environment"],
      properties: {
        goal: { type: "array", minItems: 1, items: { type: "string", minLength: 5 } },
        action: { type: "array", minItems: 1, items: { type: "string", minLength: 5 } },
        environment: { type: "array", minItems: 1, items: { type: "string", minLength: 5 } },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;
