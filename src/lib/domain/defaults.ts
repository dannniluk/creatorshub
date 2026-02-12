import type { LockedCore, StoreData } from "@/lib/domain/types";

export const DEFAULT_TEXT_POLICY: LockedCore["text_policy"] = "NO-TEXT STRICT";
export const DEFAULT_VARIANT_COUNT = 12;
export const MIN_VARIANT_COUNT = 1;
export const MAX_VARIANT_COUNT = 24;
export const DEFAULT_QC_THRESHOLD = 80;

export const DEFAULT_LOCKED_CORE: LockedCore = {
  character_lock: "",
  style_lock: "",
  composition_lock: "",
  negative_lock: "",
  text_policy: DEFAULT_TEXT_POLICY,
};

export const DEFAULT_STORE_DATA: StoreData = {
  version: 1,
  locked_core: DEFAULT_LOCKED_CORE,
  scenes: [],
  techniques: [],
  runs: [],
  variants: [],
};
