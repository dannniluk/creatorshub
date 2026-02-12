import type { LockedCore } from "@/lib/domain/types";

export type Core6Setup = {
  camera_format: string;
  lens_type: string;
  focal_length_mm: number;
  aperture: string;
  lighting_style: string;
  camera_movement: string;
};

export type GalleryPreset = {
  id: string;
  title: string;
  mood: string;
  shot_type: string;
  category: string;
  image_url: string;
  description: string;
  tags: string[];
  core6_defaults: Core6Setup;
  locked_core_defaults: LockedCore;
  example_prompts: {
    nano: string;
  };
};

export type StudioSetup = {
  preset_id: string | null;
  preset_title: string;
  scene_goal: string;
  scene_action: string;
  scene_environment: string;
  core6: Core6Setup;
  locked_core: LockedCore;
};

export type PromptPackVariant = {
  id: string;
  label: string;
  summary: string;
  prompt_nano: string;
};

export type PromptPack = {
  id: string;
  created_at: string;
  setup_snapshot: StudioSetup;
  variants: PromptPackVariant[];
};
