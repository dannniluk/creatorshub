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
  camera_format: z.string().min(2),
  lens_type: z.string().min(2),
  focal_length_mm: z.number().int().min(14).max(300),
  aperture: z.string().min(2),
  lighting_style: z.string().min(2),
});

export const studioPresetSchema = z.object({
  id: z.string().min(2),
  category: z.enum(categoryValues),
  humanTitle: z.string().min(3),
  benefit: z.string().min(10),
  goalTags: z.array(z.enum(goalValues)).min(1),
  recommended: z.boolean(),
  safeDefault: z.boolean(),
  whyThisWorks: z.array(z.string().min(4)).min(1).max(2),
  slidersMapping: slidersMappingSchema,
  techSettings: techSettingsSchema,
  sceneSubject: z.string().min(6),
  sceneComposition: z.string().min(6),
  sceneEnvironment: z.string().min(6),
});

export const studioPresetCollectionSchema = z.array(studioPresetSchema);

export const STUDIO_PRESET_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Prompt Copilot Beginner Preset",
  type: "object",
  required: [
    "id",
    "category",
    "humanTitle",
    "benefit",
    "goalTags",
    "recommended",
    "safeDefault",
    "whyThisWorks",
    "slidersMapping",
    "techSettings",
    "sceneSubject",
    "sceneComposition",
    "sceneEnvironment",
  ],
  properties: {
    id: { type: "string", minLength: 2 },
    category: {
      type: "string",
      enum: BEGINNER_CATEGORIES,
    },
    humanTitle: { type: "string", minLength: 3 },
    benefit: { type: "string", minLength: 10 },
    goalTags: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        enum: BEGINNER_GOALS,
      },
    },
    recommended: { type: "boolean" },
    safeDefault: { type: "boolean" },
    whyThisWorks: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string", minLength: 4 },
    },
    slidersMapping: {
      type: "object",
      required: ["detail", "backgroundBlur", "lightDrama"],
      properties: {
        detail: { type: "number", minimum: 0, maximum: 100 },
        backgroundBlur: { type: "number", minimum: 0, maximum: 100 },
        lightDrama: { type: "number", minimum: 0, maximum: 100 },
      },
      additionalProperties: false,
    },
    techSettings: {
      type: "object",
      required: ["camera_format", "lens_type", "focal_length_mm", "aperture", "lighting_style"],
      properties: {
        camera_format: { type: "string", minLength: 2 },
        lens_type: { type: "string", minLength: 2 },
        focal_length_mm: { type: "integer", minimum: 14, maximum: 300 },
        aperture: { type: "string", minLength: 2 },
        lighting_style: { type: "string", minLength: 2 },
      },
      additionalProperties: false,
    },
    sceneSubject: { type: "string", minLength: 6 },
    sceneComposition: { type: "string", minLength: 6 },
    sceneEnvironment: { type: "string", minLength: 6 },
  },
  additionalProperties: false,
} as const;
