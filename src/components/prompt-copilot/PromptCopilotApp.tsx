"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import { DEFAULT_GALLERY_PRESETS } from "@/lib/studio/presets";
import {
  BEGINNER_CATEGORIES,
  CATEGORY_LABELS,
  type CreatorCategory,
  GOAL_LABELS,
  STUDIO_TASK_PRESETS,
  STUDIO_TERM_GUIDE,
  type GoalTag,
  type StudioTaskPreset,
  type TechSettings,
} from "@/lib/studio/catalog";
import { studioPresetCollectionSchema } from "@/lib/studio/presetSchema";
import {
  PRO_APERTURE_PRESETS,
  PRO_CAMERA_OPTIONS,
  PRO_FOCAL_UI,
  PRO_LIGHTING_OPTIONS,
  PRO_LENS_OPTIONS,
  PRO_LOCK_TEXT,
  type ProWizardState,
  type ProWizardStep,
  clampProStep,
  createDefaultProWizard,
  explainFocalLength,
  getFocalOption,
  getRecommendedFocalRule,
  mapBlurSliderToAperture,
  nextProStep,
  patchProWizard,
  prevProStep,
  withTaskSceneDefaults,
} from "@/lib/studio/proMode";
import type { Core6Setup, GalleryPreset, PromptPack, PromptPackVariant, StudioSetup } from "@/lib/studio/types";

type TabKey = "gallery" | "studio" | "packs" | "reference";
type StudioMode = "beginner" | "pro";
type SceneKey = "goal" | "action" | "environment";

type SceneDraft = {
  goal: string;
  action: string;
  environment: string;
};

type PromptMode = "compact" | "full";

type PostCopyPanelState = {
  presetId: string;
  showPrompt: boolean;
  promptMode: PromptMode;
};

type ProLockToggleKey = "characterLock" | "styleLock" | "compositionLock" | "noTextStrict";

const VALIDATED_TASK_PRESETS = studioPresetCollectionSchema.parse(STUDIO_TASK_PRESETS);

const STORAGE_KEYS = {
  tab: "prompt-copilot/cinema/tab",
  packs: "prompt-copilot/cinema/packs",
  onboardingDismissed: "prompt-copilot/cinema/onboarding-dismissed",
  studioMode: "prompt-copilot/cinema/studio-mode",
  proWizard: "prompt-copilot/cinema/pro-wizard",
};

const GALLERY_CHUNK_SIZE = 8;
const COMPACT_PREVIEW_LINES = 6;
const PRO_WIZARD_STEPS_TOTAL = 6;
const REQUIRED_NEGATIVE_CONSTRAINTS = ["no watermark", "no text", "no deformed faces/hands", "no extra fingers", "no artifacts"];
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LOCKED_CORE_DEFAULTS = {
  character_lock: "Один и тот же главный герой во всех вариантах, стабильная внешность и возраст.",
  style_lock: "Фотореалистичный cinematic style без стилизации под 3D/аниме.",
  composition_lock: "Четкая композиция и стабильная позиция главного объекта.",
  negative_lock: "no watermark, no text, no deformed faces/hands, no extra fingers, no artifacts",
  text_policy: "NO-TEXT STRICT" as const,
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

function toCsv(packs: PromptPack[]): string {
  const headers = [
    "run_id",
    "scene_id",
    "scene_title",
    "technique_name",
    "variant_id",
    "seed",
    "qc_score",
    "status",
    "prompt_text",
    "created_at",
  ];

  const rows = packs.flatMap((pack) =>
    pack.variants.map((variant) => [
      pack.id,
      pack.setup_snapshot.preset_id ?? "",
      pack.setup_snapshot.meta?.human_title ?? pack.setup_snapshot.preset_title,
      "Nano Banana Pro",
      variant.id,
      "",
      "",
      "draft",
      variant.prompt_nano,
      pack.created_at,
    ]),
  );

  const escapeCsv = (value: string): string => {
    const escaped = value.replaceAll('"', '""');
    if (/[",\n]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  return [headers.join(","), ...rows.map((row) => row.map((value) => escapeCsv(String(value))).join(","))].join("\n");
}

function downloadFile(fileName: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function variantPrompt(variant: PromptPackVariant): string {
  return variant.prompt_nano;
}

function getPresetById(id: string): StudioTaskPreset {
  return VALIDATED_TASK_PRESETS.find((preset) => preset.id === id) ?? VALIDATED_TASK_PRESETS[0]!;
}

function makeInitialSceneDraft(preset: StudioTaskPreset): SceneDraft {
  return {
    goal: preset.sceneTemplates.goal[0] ?? "",
    action: preset.sceneTemplates.action[0] ?? "",
    environment: preset.sceneTemplates.environment[0] ?? "",
  };
}

function makeSetup(input: {
  preset: StudioTaskPreset;
  scene: SceneDraft;
  tech: TechSettings;
}): StudioSetup {
  const presetNegative = input.preset.locks.negativeLock.map((item) => item.trim()).filter(Boolean);
  const mergedNegative = Array.from(new Set([...REQUIRED_NEGATIVE_CONSTRAINTS, ...presetNegative]));

  return {
    preset_id: input.preset.id,
    preset_title: input.preset.humanTitle,
    scene_goal: input.scene.goal,
    scene_action: input.scene.action,
    scene_environment: input.scene.environment,
    core6: {
      camera_format: input.tech.camera,
      lens_type: input.tech.lens_profile,
      focal_length_mm: input.tech.focal_mm,
      aperture: input.tech.aperture,
      lighting_style: input.tech.lighting,
      camera_movement: "Статичный кадр",
    },
    locked_core: {
      ...LOCKED_CORE_DEFAULTS,
      negative_lock: mergedNegative.join(", "),
      text_policy: "NO-TEXT STRICT",
    },
    meta: {
      category: input.preset.category,
      goal: input.preset.goal,
      human_title: input.preset.humanTitle,
      benefit: input.preset.benefit,
      result_chips: input.preset.resultChips,
      why_works: input.preset.whyWorks,
    },
  };
}

function setupToTech(core6: Core6Setup): TechSettings {
  return {
    camera: core6.camera_format,
    lens_profile: core6.lens_type,
    focal_mm: core6.focal_length_mm,
    aperture: core6.aperture,
    lighting: core6.lighting_style,
  };
}

function renderPromptTemplate(template: string, tokens: Record<string, string>): string {
  return template.replaceAll(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => tokens[key] ?? "");
}

function withCompactLines(text: string, lines = COMPACT_PREVIEW_LINES): string {
  return text.split("\n").slice(0, lines).join("\n");
}

function buildPresetPromptPreview(input: { preset: StudioTaskPreset; setup: StudioSetup }): { compact: string; full: string } {
  const { preset, setup } = input;
  const noTextPolicy = "NO-TEXT STRICT";
  const tokens: Record<string, string> = {
    SCENE_GOAL: setup.scene_goal,
    SCENE_ACTION: setup.scene_action,
    SCENE_ENVIRONMENT: setup.scene_environment,
    CAMERA: setup.core6.camera_format,
    LENS_PROFILE: setup.core6.lens_type,
    FOCAL_MM: String(setup.core6.focal_length_mm),
    APERTURE: setup.core6.aperture,
    LIGHTING: setup.core6.lighting_style,
    LOCK_CHARACTER: preset.locks.characterLock ? setup.locked_core.character_lock : "off",
    LOCK_STYLE: preset.locks.styleLock ? setup.locked_core.style_lock : "off",
    LOCK_COMPOSITION: preset.locks.compositionLock ? setup.locked_core.composition_lock : "off",
    NEGATIVE_CONSTRAINTS: setup.locked_core.negative_lock,
    NO_TEXT_POLICY: noTextPolicy,
  };

  return {
    compact: renderPromptTemplate(preset.promptTemplateCompact, tokens),
    full: renderPromptTemplate(preset.promptTemplateFull, tokens),
  };
}

function apertureToSliderValue(aperture: string): number {
  const index = PRO_APERTURE_PRESETS.findIndex((item) => item === aperture);
  if (index === -1) {
    return 25;
  }
  return index * 25;
}

function buildSetupFromProWizard(input: { preset: StudioTaskPreset; wizard: ProWizardState }): StudioSetup {
  const negativeLock = Array.from(new Set([...REQUIRED_NEGATIVE_CONSTRAINTS, ...input.wizard.locks.negativeLock])).join(", ");

  return {
    preset_id: input.preset.id,
    preset_title: "Pro режим",
    scene_goal: input.wizard.scene.goal,
    scene_action: input.wizard.scene.action,
    scene_environment: input.wizard.scene.environment,
    core6: {
      camera_format: input.wizard.camera,
      lens_type: input.wizard.lens_profile,
      focal_length_mm: input.wizard.focal_mm,
      aperture: input.wizard.aperture,
      lighting_style: input.wizard.lighting_style,
      camera_movement: "Статичный кадр",
    },
    locked_core: {
      character_lock: input.wizard.locks.characterLock ? PRO_LOCK_TEXT.character : "off",
      style_lock: input.wizard.locks.styleLock ? PRO_LOCK_TEXT.style : "off",
      composition_lock: input.wizard.locks.compositionLock ? PRO_LOCK_TEXT.composition : "off",
      negative_lock: negativeLock,
      text_policy: "NO-TEXT STRICT",
    },
    meta: {
      category: input.preset.category,
      goal: input.preset.goal,
      human_title: `Pro: ${input.preset.humanTitle}`,
      benefit: input.preset.benefit,
      result_chips: input.preset.resultChips,
      why_works: input.preset.whyWorks,
    },
  };
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((item) => {
    if (item.hasAttribute("disabled")) {
      return false;
    }

    return item.getAttribute("aria-hidden") !== "true";
  });
}

function useFocusTrap(options: {
  active: boolean;
  containerRef: { current: HTMLElement | null };
  onEscape?: () => void;
}): void {
  const { active, containerRef, onEscape } = options;

  useEffect(() => {
    if (!active) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previousFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = getFocusable(container);
    (focusables[0] ?? container).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusables = getFocusable(container);
      if (currentFocusables.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = currentFocusables[0]!;
      const last = currentFocusables[currentFocusables.length - 1]!;
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === first || !container.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeElement || activeElement === last || !container.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocused?.focus();
    };
  }, [active, containerRef, onEscape]);
}

export default function PromptCopilotApp() {
  const starterPreset = VALIDATED_TASK_PRESETS[0]!;
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") {
      return "gallery";
    }

    return safeParse<TabKey>(localStorage.getItem(STORAGE_KEYS.tab)) ?? "gallery";
  });

  const [activePreset, setActivePreset] = useState<GalleryPreset | null>(null);
  const [galleryQuery, setGalleryQuery] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("Все");
  const [visiblePresetCount, setVisiblePresetCount] = useState(GALLERY_CHUNK_SIZE);

  const [studioQuery, setStudioQuery] = useState("");
  const [studioCategoryFilter, setStudioCategoryFilter] = useState<"Все" | CreatorCategory>("Все");
  const [selectedPresetId, setSelectedPresetId] = useState(starterPreset.id);
  const [sceneDraft, setSceneDraft] = useState<SceneDraft>(() => makeInitialSceneDraft(starterPreset));
  const [techOverrides, setTechOverrides] = useState<Partial<TechSettings>>({});
  const [studioMode, setStudioMode] = useState<StudioMode>(() => {
    if (typeof window === "undefined") {
      return "beginner";
    }

    const stored = safeParse<StudioMode>(localStorage.getItem(STORAGE_KEYS.studioMode));
    return stored === "pro" ? "pro" : "beginner";
  });
  const [proWizard, setProWizard] = useState<ProWizardState>(() => {
    if (typeof window === "undefined") {
      return createDefaultProWizard();
    }

    const stored = safeParse<Partial<ProWizardState>>(localStorage.getItem(STORAGE_KEYS.proWizard));
    if (!stored) {
      return createDefaultProWizard();
    }

    const restored = patchProWizard(createDefaultProWizard(), {
      step: clampProStep(Number(stored.step ?? 1)),
      camera: stored.camera,
      lens_profile: stored.lens_profile,
      focal_mm: stored.focal_mm,
      aperture: stored.aperture,
      lighting_style: stored.lighting_style,
      scene: stored.scene,
      locks: stored.locks,
    });

    return restored;
  });
  const [proPromptDrawerOpen, setProPromptDrawerOpen] = useState(false);
  const [proPromptMode, setProPromptMode] = useState<PromptMode>("compact");
  const [proAdvancedOpen, setProAdvancedOpen] = useState(false);
  const [isInteractingWithControl, setIsInteractingWithControl] = useState(false);
  const [proApertureSliderValue, setProApertureSliderValue] = useState(() => apertureToSliderValue(createDefaultProWizard().aperture));
  const [detailsPresetId, setDetailsPresetId] = useState<string | null>(null);
  const [detailsPromptMode, setDetailsPromptMode] = useState<PromptMode>("compact");
  const [postCopyPanel, setPostCopyPanel] = useState<PostCopyPanelState | null>(null);
  const [showOnboardingTip, setShowOnboardingTip] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(STORAGE_KEYS.onboardingDismissed) !== "1";
  });
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);
  const postCopyPanelRef = useRef<HTMLDivElement | null>(null);
  const proPromptDrawerRef = useRef<HTMLDivElement | null>(null);

  const [packs, setPacks] = useState<PromptPack[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return safeParse<PromptPack[]>(localStorage.getItem(STORAGE_KEYS.packs)) ?? [];
  });
  const [generatedPack, setGeneratedPack] = useState<PromptPack | null>(null);
  const [activePackId, setActivePackId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedPacks = safeParse<PromptPack[]>(localStorage.getItem(STORAGE_KEYS.packs)) ?? [];
    return storedPacks[0]?.id ?? null;
  });

  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);

  const selectedPreset = useMemo(() => getPresetById(selectedPresetId), [selectedPresetId]);

  const effectiveTech = useMemo(() => {
    return {
      ...selectedPreset.defaults,
      ...techOverrides,
    };
  }, [selectedPreset.defaults, techOverrides]);

  const studioSetup = useMemo(() => {
    return makeSetup({
      preset: selectedPreset,
      scene: sceneDraft,
      tech: effectiveTech,
    });
  }, [effectiveTech, sceneDraft, selectedPreset]);

  const proSetup = useMemo(() => {
    return buildSetupFromProWizard({
      preset: selectedPreset,
      wizard: proWizard,
    });
  }, [proWizard, selectedPreset]);

  const safeDefaultByCategory = useMemo(() => {
    const result: Partial<Record<CreatorCategory, string>> = {};
    for (const preset of VALIDATED_TASK_PRESETS) {
      if (!preset.safeDefault) {
        continue;
      }
      if (!result[preset.category]) {
        result[preset.category] = preset.id;
      }
    }
    return result;
  }, []);

  const activePack = useMemo(() => {
    if (!activePackId) {
      return packs[0] ?? null;
    }
    return packs.find((pack) => pack.id === activePackId) ?? null;
  }, [activePackId, packs]);

  const activeDetailsPreset = detailsPresetId ? getPresetById(detailsPresetId) : null;
  const activePostCopyPreset = postCopyPanel?.presetId ? getPresetById(postCopyPanel.presetId) : null;

  const filteredGalleryPresets = useMemo(() => {
    const query = galleryQuery.trim().toLowerCase();

    return DEFAULT_GALLERY_PRESETS.filter((preset) => {
      if (galleryCategory !== "Все" && preset.category !== galleryCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [preset.title, preset.mood, preset.category, preset.description, ...preset.tags].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [galleryCategory, galleryQuery]);

  const galleryCategories = useMemo(() => {
    const values = Array.from(new Set(DEFAULT_GALLERY_PRESETS.map((item) => item.category)));
    return ["Все", ...values];
  }, []);

  const visibleGalleryPresets = useMemo(
    () => filteredGalleryPresets.slice(0, Math.max(visiblePresetCount, GALLERY_CHUNK_SIZE)),
    [filteredGalleryPresets, visiblePresetCount],
  );

  const filteredTaskPresets = useMemo(() => {
    return VALIDATED_TASK_PRESETS.filter((preset) => {
      if (studioCategoryFilter !== "Все" && preset.category !== studioCategoryFilter) {
        return false;
      }

      const query = studioQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      const searchable = [preset.humanTitle, preset.benefit, CATEGORY_LABELS[preset.category], GOAL_LABELS[preset.goal], ...preset.resultChips]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [studioCategoryFilter, studioQuery]);

  const activeTerm = STUDIO_TERM_GUIDE.find((item) => item.id === activeTermId) ?? null;

  const buildSetupForPreset = (preset: StudioTaskPreset): StudioSetup => {
    const isSelected = preset.id === selectedPreset.id;
    const scene = isSelected ? sceneDraft : makeInitialSceneDraft(preset);
    const tech = isSelected ? effectiveTech : preset.defaults;
    return makeSetup({
      preset,
      scene,
      tech,
    });
  };

  const activeDetailsPreview = activeDetailsPreset
    ? buildPresetPromptPreview({ preset: activeDetailsPreset, setup: buildSetupForPreset(activeDetailsPreset) })
    : null;

  const activePostCopyPreview = activePostCopyPreset
    ? buildPresetPromptPreview({ preset: activePostCopyPreset, setup: buildSetupForPreset(activePostCopyPreset) })
    : null;
  const proPromptPreview = proWizard.output;
  const proSelectedFocalOption = getFocalOption(proWizard.focal_mm);
  const proFocalExplanation = explainFocalLength(proWizard.focal_mm);
  const proFocalRecommendation = getRecommendedFocalRule({
    category: selectedPreset.category,
    goal: selectedPreset.goal,
  });

  useFocusTrap({
    active: Boolean(activeDetailsPreset),
    containerRef: detailsPanelRef,
    onEscape: () => setDetailsPresetId(null),
  });

  useFocusTrap({
    active: Boolean(postCopyPanel),
    containerRef: postCopyPanelRef,
    onEscape: () => setPostCopyPanel(null),
  });

  useFocusTrap({
    active: proPromptDrawerOpen,
    containerRef: proPromptDrawerRef,
    onEscape: () => setProPromptDrawerOpen(false),
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(packs));
  }, [packs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.studioMode, JSON.stringify(studioMode));
  }, [studioMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.proWizard, JSON.stringify(proWizard));
  }, [proWizard]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (!isInteractingWithControl) {
      return;
    }

    const release = () => setIsInteractingWithControl(false);

    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("touchcancel", release);

    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
      window.removeEventListener("touchcancel", release);
    };
  }, [isInteractingWithControl]);

  const resetSelectionToPresetDefaults = (preset: StudioTaskPreset) => {
    setSceneDraft(makeInitialSceneDraft(preset));
    setTechOverrides({});
  };

  const selectTaskPreset = (preset: StudioTaskPreset) => {
    setSelectedPresetId(preset.id);
    resetSelectionToPresetDefaults(preset);
  };

  const handleCopyText = async (text: string, successText = "Скопировано ✅") => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", text: successText });
    } catch {
      setToast({ kind: "error", text: "Не удалось скопировать текст" });
    }
  };

  const handleGeneratePack = (setup = studioSetup) => {
    const pack = generatePromptPack({ setup });
    setGeneratedPack(pack);
    setPacks((current) => [pack, ...current].slice(0, 60));
    setActivePackId(pack.id);
    setToast({ kind: "success", text: "Собрано 4 варианта" });
  };

  const handleCopyPresetCompact = async (preset: StudioTaskPreset) => {
    selectTaskPreset(preset);
    const setup = buildSetupForPreset(preset);
    const preview = buildPresetPromptPreview({ preset, setup });
    await handleCopyText(preview.compact);
    setPostCopyPanel({
      presetId: preset.id,
      showPrompt: false,
      promptMode: "compact",
    });
  };

  const handleShowPresetDetails = (preset: StudioTaskPreset) => {
    selectTaskPreset(preset);
    setDetailsPresetId(preset.id);
    setDetailsPromptMode("compact");
  };

  const handleCopyAllPack = async () => {
    if (!activePack) {
      setToast({ kind: "error", text: "Нет набора для копирования" });
      return;
    }

    const content = activePack.variants
      .map((variant, index) => `# ${index + 1}. ${variant.label}\n${variant.prompt_nano}`)
      .join("\n\n");

    await handleCopyText(content);
  };

  const handleExportJson = (pack: PromptPack) => {
    downloadFile(`${pack.id}.json`, JSON.stringify(pack, null, 2), "application/json;charset=utf-8");
    setToast({ kind: "success", text: "JSON выгружен" });
  };

  const handleExportCsv = (pack: PromptPack) => {
    downloadFile(`${pack.id}.csv`, toCsv([pack]), "text/csv;charset=utf-8");
    setToast({ kind: "success", text: "CSV выгружен" });
  };

  const openPackInStudio = (pack: PromptPack) => {
    const presetId = pack.setup_snapshot.preset_id;
    if (presetId) {
      setSelectedPresetId(presetId);
    }

    setSceneDraft({
      goal: pack.setup_snapshot.scene_goal,
      action: pack.setup_snapshot.scene_action,
      environment: pack.setup_snapshot.scene_environment,
    });

    setTechOverrides(setupToTech(pack.setup_snapshot.core6));
    setGeneratedPack(pack);
    setActiveTab("studio");
    setToast({ kind: "success", text: "Набор открыт в Студии" });
  };

  const patchWizardState = (patch: Partial<Omit<ProWizardState, "output">>) => {
    setProWizard((current) => patchProWizard(current, patch));
  };

  const openProFromPreset = (preset: StudioTaskPreset) => {
    selectTaskPreset(preset);
    const baseWizard = createDefaultProWizard({
      step: 1,
      camera: preset.defaults.camera,
      lens_profile: preset.defaults.lens_profile,
      focal_mm: preset.defaults.focal_mm,
      aperture: preset.defaults.aperture,
      lighting_style: preset.defaults.lighting,
      scene: withTaskSceneDefaults(preset),
    });
    setProWizard(baseWizard);
    setProApertureSliderValue(apertureToSliderValue(baseWizard.aperture));
    setStudioMode("pro");
    setProPromptDrawerOpen(false);
  };

  const goToProStep = (step: ProWizardStep) => {
    patchWizardState({ step });
  };

  const handleProBack = () => {
    patchWizardState({ step: prevProStep(proWizard.step) });
  };

  const handleProCameraSelect = (camera: string) => {
    patchWizardState({
      camera,
      step: nextProStep(1),
    });
  };

  const handleProLensSelect = (lens: string) => {
    patchWizardState({
      lens_profile: lens,
      step: nextProStep(2),
    });
  };

  const handleProFocalSelect = (focal: number) => {
    patchWizardState({
      focal_mm: focal,
      step: nextProStep(3),
    });
  };

  const handleProApertureSelect = (aperture: string, sliderValue?: number) => {
    patchWizardState({
      aperture,
    });
    if (typeof sliderValue === "number") {
      setProApertureSliderValue(sliderValue);
      return;
    }
    setProApertureSliderValue(apertureToSliderValue(aperture));
  };

  const handleProApertureBack = () => {
    patchWizardState({
      step: prevProStep(4),
    });
  };

  const handleProApertureNext = () => {
    patchWizardState({
      step: nextProStep(4),
    });
  };

  const handleProLightingSelect = (lighting: string) => {
    patchWizardState({
      lighting_style: lighting,
      step: nextProStep(5),
    });
  };

  const handleProSceneUpdate = (key: SceneKey, value: string) => {
    patchWizardState({
      scene: {
        ...proWizard.scene,
        [key]: value,
      },
    });
  };

  const handleProDrawerCopy = async () => {
    await handleCopyText(proPromptPreview.compactPrompt);
  };

  const handleProAddToPack = () => {
    handleGeneratePack(proSetup);
  };

  const handleProReset = () => {
    const reset = createDefaultProWizard({
      scene: withTaskSceneDefaults(selectedPreset),
    });
    setProWizard(reset);
    setProApertureSliderValue(apertureToSliderValue(reset.aperture));
    setToast({ kind: "success", text: "Pro настройки сброшены" });
  };

  const handleProLockToggle = (key: ProLockToggleKey) => {
    patchWizardState({
      locks: {
        ...proWizard.locks,
        [key]: !proWizard.locks[key],
      },
    });
  };

  const handleProNegativeLockChange = (value: string) => {
    const nextItems = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    patchWizardState({
      locks: {
        ...proWizard.locks,
        negativeLock: nextItems,
      },
    });
  };

  const handleProWizardKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (isInteractingWithControl) {
      return;
    }

    if (event.target instanceof HTMLInputElement && event.target.type === "range") {
      return;
    }

    if (proWizard.step === 4 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleProBack();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      patchWizardState({ step: clampProStep(proWizard.step + 1) });
    }
  };

  const stopWizardGesturePropagation = (event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const beginControlInteraction = (event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsInteractingWithControl(true);
  };

  const endControlInteraction = (event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsInteractingWithControl(false);
  };

  const applyReferenceTerm = (termId: string) => {
    const term = STUDIO_TERM_GUIDE.find((item) => item.id === termId);
    if (!term?.applyValue) {
      setToast({ kind: "error", text: "Для этого термина нет автоматического применения" });
      return;
    }

    setTechOverrides((current) => ({
      ...current,
      lighting: term.applyValue,
    }));

    setToast({ kind: "success", text: `Применено из справочника: ${term.term}` });
  };

  const tabClass = (tab: TabKey): string =>
    `rounded-full px-5 py-2 text-[15px] font-medium transition ${
      activeTab === tab ? "bg-white text-[#0f0f12]" : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]"
    }`;

  const galleryImageHeights = ["h-44", "h-72", "h-56", "h-80", "h-52", "h-64"] as const;
  const proSlideWidth = 100 / PRO_WIZARD_STEPS_TOTAL;
  const proSlideOffset = (proWizard.step - 1) * proSlideWidth;

  return (
    <div className="min-h-screen bg-[#040405] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_2%,rgba(255,255,255,0.1),transparent_18%),radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.06),transparent_20%)]" />
      <div className="relative mx-auto max-w-[1720px] px-4 pb-10 pt-6 md:px-8 lg:px-12">
        <header className="rounded-[30px] border border-white/10 bg-[#08090b]/90 px-5 py-4 shadow-[0_18px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:px-7">
          <div className="grid items-center gap-4 lg:grid-cols-[1.1fr_1.2fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 grid-cols-2 gap-[3px] rounded-full p-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span key={`dot-${index}`} className="h-[6px] w-[6px] rounded-full bg-white/90" />
                  ))}
                </span>
                <p className="font-display text-[11px] uppercase tracking-[0.34em] text-zinc-500">Cinema Studio</p>
              </div>
              <button
                data-testid="brand-home-btn"
                className="text-left font-display text-4xl font-semibold tracking-tight text-zinc-100 transition hover:text-zinc-200 md:text-[44px]"
                onClick={() => setActiveTab("gallery")}
              >
                Prompt Copilot
              </button>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <div className="flex items-center gap-3 text-zinc-400">
                <span className="text-base leading-none">✦</span>
                <input
                  className="w-full bg-transparent text-[15px] text-zinc-200 outline-none placeholder:text-zinc-500"
                  placeholder="Поиск по сценам, стилям, задачам"
                  value={galleryQuery}
                  onChange={(event) => {
                    setGalleryQuery(event.target.value);
                    setVisiblePresetCount(GALLERY_CHUNK_SIZE);
                  }}
                />
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-end gap-2">
              <button data-testid="tab-gallery" className={tabClass("gallery")} onClick={() => setActiveTab("gallery")}>Галерея</button>
              <button data-testid="tab-studio" className={tabClass("studio")} onClick={() => setActiveTab("studio")}>Студия</button>
              <button data-testid="tab-packs" className={tabClass("packs")} onClick={() => setActiveTab("packs")}>Наборы</button>
              <button className={tabClass("reference")} onClick={() => setActiveTab("reference")}>Справочник</button>
              <button className="ml-2 rounded-full bg-white px-6 py-2 text-[15px] font-semibold text-[#111214]">Создать</button>
            </nav>
          </div>
        </header>

        {activeTab === "gallery" ? (
          <section className="mt-4 rounded-[30px] border border-white/10 bg-[#07080a]/95 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.4)] md:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Галерея референсов</h2>
                <p className="mt-1 text-sm text-zinc-500">Выбирай стиль, изучай готовый промпт и отправляй сетап в Студию.</p>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 md:block">
                {filteredGalleryPresets.length} референсов
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {galleryCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    galleryCategory === category
                      ? "border-white/40 bg-white text-zinc-950"
                      : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1]"
                  }`}
                  onClick={() => {
                    setGalleryCategory(category);
                    setVisiblePresetCount(GALLERY_CHUNK_SIZE);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="columns-1 gap-4 sm:columns-2 xl:columns-4">
              {visibleGalleryPresets.map((preset, index) => (
                <button
                  type="button"
                  key={preset.id}
                  data-testid="gallery-card"
                  className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] text-left transition hover:-translate-y-[2px] hover:border-white/25"
                  onClick={() => setActivePreset(preset)}
                >
                  <img
                    src={preset.image_url}
                    alt={preset.title}
                    className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${galleryImageHeights[index % galleryImageHeights.length]}`}
                  />
                  <div className="p-3">
                    <p className="font-display text-base text-zinc-100">{preset.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {visiblePresetCount < filteredGalleryPresets.length ? (
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  className="rounded-full border border-white/20 bg-white/[0.05] px-6 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.12]"
                  onClick={() => setVisiblePresetCount((current) => current + GALLERY_CHUNK_SIZE)}
                >
                  Еще
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === "studio" ? (
          <section className="mt-4 space-y-4 pb-24">
            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {studioMode === "beginner" ? "Студия для новичков" : "Pro режим"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {studioMode === "beginner"
                      ? "Выбери задачу, нажми «Скопировать промпт» и сразу работай в модели."
                      : "Пошаговая сборка production-safe промпта: Камера → Объектив → Фокусное → Диафрагма → Свет → Финал."}
                  </p>
                </div>

                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                  <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs transition ${
                      studioMode === "beginner" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                    onClick={() => setStudioMode("beginner")}
                  >
                    Минималистичный режим
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs transition ${
                      studioMode === "pro" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                    onClick={() => setStudioMode("pro")}
                  >
                    Pro режим
                  </button>
                </div>
              </div>

              {studioMode === "beginner" ? (
                <>
                  {showOnboardingTip ? (
                    <div className="mb-4 rounded-2xl border border-white/10 bg-[#101217] p-3 text-xs text-zinc-300">
                      <p>Подсказка: копирование с карточки сразу дает компактный production-safe промпт.</p>
                      <button
                        type="button"
                        className="mt-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-[11px] text-zinc-100"
                        onClick={() => {
                          setShowOnboardingTip(false);
                          localStorage.setItem(STORAGE_KEYS.onboardingDismissed, "1");
                        }}
                      >
                        Не показывать снова
                      </button>
                    </div>
                  ) : null}

                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        studioCategoryFilter === "Все"
                          ? "border-white/40 bg-white text-zinc-950"
                          : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.12]"
                      }`}
                      onClick={() => setStudioCategoryFilter("Все")}
                    >
                      Все
                    </button>
                    {BEGINNER_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          studioCategoryFilter === category
                            ? "border-white/40 bg-white text-zinc-950"
                            : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.12]"
                        }`}
                        onClick={() => setStudioCategoryFilter(category)}
                      >
                        {CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>

                  <label className="mb-4 block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-zinc-500">Поиск задач</span>
                    <input
                      type="search"
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/25"
                      placeholder="Например: портрет, каталожка, фактура"
                      value={studioQuery}
                      onChange={(event) => setStudioQuery(event.target.value)}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTaskPresets.map((preset) => {
                      const isSafeDefault = safeDefaultByCategory[preset.category] === preset.id;
                      return (
                        <article key={preset.id} data-testid="studio-task-card" className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-2xl leading-tight text-zinc-100">{preset.humanTitle}</p>
                            {isSafeDefault ? (
                              <span className="rounded-full border border-sky-300/35 bg-sky-300/10 px-2 py-1 text-[10px] text-sky-200">
                                Безопасный старт
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 truncate text-sm text-zinc-400">{preset.benefit}</p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {preset.resultChips.slice(0, 4).map((chip) => (
                              <span
                                key={`${preset.id}-${chip}`}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            data-testid={`copy-prompt-${preset.id}`}
                            aria-label={`Скопировать промпт для задачи ${preset.humanTitle}`}
                            className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                            onClick={() => void handleCopyPresetCompact(preset)}
                          >
                            Скопировать промпт
                          </button>

                          <button
                            type="button"
                            data-testid={`details-${preset.id}`}
                            aria-label={`Открыть детали для задачи ${preset.humanTitle}`}
                            className="mt-2 w-full rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100 transition hover:bg-white/[0.14]"
                            onClick={() => handleShowPresetDetails(preset)}
                          >
                            Детали
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {filteredTaskPresets.length === 0 ? (
                    <p className="mt-4 text-sm text-zinc-400">По этому фильтру пока нет карточек. Попробуйте другую категорию или поиск.</p>
                  ) : null}
                </>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div
                    data-testid="pro-wizard"
                    className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4"
                    tabIndex={0}
                    onKeyDown={handleProWizardKeyDown}
                    aria-label="Пошаговый Pro мастер"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-100 disabled:opacity-40"
                        onClick={handleProBack}
                        disabled={proWizard.step === 1}
                      >
                        Назад
                      </button>

                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Шаг {proWizard.step} / 6</p>

                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-100"
                        onClick={handleProReset}
                      >
                        Сброс
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1.5 md:grid-cols-6">
                      {[
                        ["Камера", 1],
                        ["Объектив", 2],
                        ["Фокусное", 3],
                        ["Диафрагма", 4],
                        ["Свет", 5],
                        ["Финал", 6],
                      ].map(([label, value]) => {
                        const stepValue = value as ProWizardStep;
                        const isActive = proWizard.step === stepValue;
                        const isPast = stepValue < proWizard.step;

                        return (
                          <button
                            key={label}
                            type="button"
                            className={`h-12 rounded-xl px-2 text-[11px] transition ${
                              isActive
                                ? "bg-white text-zinc-950"
                                : isPast
                                  ? "bg-white/[0.08] text-zinc-100 hover:bg-white/[0.14]"
                                  : "bg-white/[0.03] text-zinc-500"
                            }`}
                            onClick={() => goToProStep(stepValue)}
                            disabled={stepValue > proWizard.step}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 overflow-hidden">
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                          width: `${PRO_WIZARD_STEPS_TOTAL * 100}%`,
                          transform: `translateX(-${proSlideOffset}%)`,
                        }}
                      >
                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">1. Выбери камеру</h3>
                          <div data-testid="pro-step-camera-grid" className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
                            {PRO_CAMERA_OPTIONS.map((camera) => (
                              <button
                                key={camera.label}
                                type="button"
                                className={`flex min-h-[132px] flex-col rounded-2xl border p-3 text-left transition ${
                                  proWizard.camera === camera.label
                                    ? "border-white/40 bg-white/[0.11]"
                                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                                }`}
                                onClick={() => handleProCameraSelect(camera.label)}
                              >
                                <p className="text-sm font-semibold text-zinc-100">{camera.label}</p>
                                <p className="mt-1 text-[11px] text-zinc-400">{camera.bestFor}</p>
                                <div className="mt-auto flex flex-wrap gap-1 pt-3">
                                  {camera.chips.map((chip) => (
                                    <span key={`${camera.label}-${chip}`} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                                      {chip}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">2. Выбери тип объектива</h3>
                          <div data-testid="pro-step-lens-grid" className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
                            {PRO_LENS_OPTIONS.map((lens) => (
                              <button
                                key={lens.label}
                                type="button"
                                className={`flex min-h-[132px] flex-col rounded-2xl border p-3 text-left transition ${
                                  proWizard.lens_profile === lens.label
                                    ? "border-white/40 bg-white/[0.11]"
                                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                                }`}
                                onClick={() => handleProLensSelect(lens.label)}
                              >
                                <p className="text-sm font-semibold text-zinc-100">{lens.label}</p>
                                <p className="mt-1 text-[11px] text-zinc-400">{lens.effect}</p>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">3. {PRO_FOCAL_UI.title}</h3>
                          <p className="mt-2 text-xs text-zinc-400">{PRO_FOCAL_UI.helperText.default}</p>
                          <div className="mt-2 grid gap-1 sm:grid-cols-2">
                            {PRO_FOCAL_UI.helperText.ranges.map((item) => (
                              <p key={item.range} className="text-[11px] text-zinc-500">
                                <span className="text-zinc-300">{item.range}</span> — {item.text}
                              </p>
                            ))}
                          </div>
                          {proFocalRecommendation ? (
                            <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-2.5">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/80">Рекомендовано для задачи</p>
                              <p className="mt-1 text-xs text-zinc-100">
                                {proFocalRecommendation.recommendedMm} мм: {proFocalRecommendation.reason}
                              </p>
                            </div>
                          ) : null}
                          <div data-testid="pro-step-focal-grid" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {PRO_FOCAL_UI.options.map((option) => (
                              <button
                                key={option.mm}
                                type="button"
                                className={`flex min-h-[132px] flex-col rounded-2xl border p-3 text-left transition ${
                                  proWizard.focal_mm === option.mm
                                    ? "border-white/40 bg-white text-zinc-950"
                                    : "border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/[0.08]"
                                }`}
                                onClick={() => handleProFocalSelect(option.mm)}
                              >
                                <p className="text-sm font-semibold">
                                  {option.mm} мм · {option.label}
                                </p>
                                <p className={`mt-1 text-[11px] ${proWizard.focal_mm === option.mm ? "text-zinc-700" : "text-zinc-400"}`}>{option.description}</p>
                                <div className="mt-auto flex flex-wrap gap-1 pt-3">
                                  {option.bestFor.slice(0, 3).map((chip) => (
                                    <span
                                      key={`${option.mm}-${chip}`}
                                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        proWizard.focal_mm === option.mm ? "bg-zinc-900/10 text-zinc-700" : "bg-white/10 text-zinc-300"
                                      }`}
                                    >
                                      {chip}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-zinc-400">{proFocalExplanation}</p>
                          {proSelectedFocalOption ? (
                            <p className="mt-1 text-[11px] text-zinc-500">
                              Выбрано: {proSelectedFocalOption.mm} мм ({proSelectedFocalOption.label})
                            </p>
                          ) : null}
                        </section>

                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">4. Настрой диафрагму</h3>
                          <div
                            data-testid="pro-aperture-slider-wrapper"
                            className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 touch-none overscroll-contain"
                            onPointerDown={beginControlInteraction}
                            onPointerMove={stopWizardGesturePropagation}
                            onPointerUp={endControlInteraction}
                            onPointerCancel={endControlInteraction}
                            onMouseDown={beginControlInteraction}
                            onMouseMove={stopWizardGesturePropagation}
                            onMouseUp={endControlInteraction}
                            onTouchStart={beginControlInteraction}
                            onTouchMove={stopWizardGesturePropagation}
                            onTouchEnd={endControlInteraction}
                            onTouchCancel={endControlInteraction}
                          >
                            <p className="text-xs text-zinc-400">Больше размытия ↔ Больше деталей</p>
                            <input
                              data-testid="pro-aperture-slider"
                              type="range"
                              min={0}
                              max={100}
                              value={proApertureSliderValue}
                              className="mt-3 w-full accent-white"
                              onChange={(event) => {
                                const slider = Number(event.target.value);
                                const mapped = mapBlurSliderToAperture(slider);
                                handleProApertureSelect(mapped, slider);
                              }}
                            />
                            <p className="mt-2 text-sm text-zinc-200">Текущее: {proWizard.aperture}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {PRO_APERTURE_PRESETS.map((aperture) => (
                              <button
                                key={aperture}
                                type="button"
                                className={`h-11 rounded-full border px-3 text-xs transition ${
                                  proWizard.aperture === aperture
                                    ? "border-white/40 bg-white text-zinc-950"
                                    : "border-white/10 bg-white/[0.05] text-zinc-100 hover:bg-white/[0.12]"
                                }`}
                                onClick={() => handleProApertureSelect(aperture)}
                              >
                                {aperture}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              data-testid="pro-aperture-back"
                              type="button"
                              className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100 transition hover:bg-white/[0.12]"
                              onClick={handleProApertureBack}
                            >
                              Назад
                            </button>
                            <button
                              data-testid="pro-aperture-next"
                              type="button"
                              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                              onClick={handleProApertureNext}
                            >
                              Дальше
                            </button>
                          </div>
                        </section>

                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">5. Выбери свет</h3>
                          <div data-testid="pro-step-light-grid" className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
                            {PRO_LIGHTING_OPTIONS.map((light) => (
                              <button
                                key={light.label}
                                type="button"
                                className={`flex min-h-[132px] flex-col rounded-2xl border p-3 text-left transition ${
                                  proWizard.lighting_style === light.label
                                    ? "border-white/40 bg-white/[0.11]"
                                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                                }`}
                                onClick={() => handleProLightingSelect(light.label)}
                              >
                                <p className="text-sm font-semibold text-zinc-100">{light.label}</p>
                                <p className="mt-1 text-[11px] text-zinc-400">{light.bestFor}</p>
                              </button>
                            ))}
                          </div>
                        </section>

                        <section className="shrink-0 pr-4" style={{ width: `${proSlideWidth}%` }}>
                          <h3 className="text-sm font-semibold text-zinc-100">6. Финал</h3>
                          <article className="mt-3 rounded-2xl border border-white/10 bg-[#090b10] p-4">
                            <p className="text-sm font-semibold text-zinc-100">Вы выбрали</p>
                            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                              <li>Камера: {proWizard.camera}</li>
                              <li>Объектив: {proWizard.lens_profile}</li>
                              <li>Фокусное: {proWizard.focal_mm} мм</li>
                              <li>Диафрагма: {proWizard.aperture}</li>
                              <li>Свет: {proWizard.lighting_style}</li>
                            </ul>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100"
                                onClick={() => {
                                  setProPromptMode("compact");
                                  setProPromptDrawerOpen(true);
                                }}
                              >
                                Показать промпт
                              </button>
                              <button
                                type="button"
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950"
                                onClick={() => void handleProDrawerCopy()}
                              >
                                Скопировать
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100"
                                onClick={handleProAddToPack}
                              >
                                Добавить в пакет
                              </button>
                            </div>
                          </article>
                        </section>
                      </div>
                    </div>
                  </div>

                  <aside data-testid="pro-current-setup" className="sticky top-6 hidden h-fit rounded-2xl border border-white/10 bg-[#0d0f14] p-4 xl:block">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Текущий сетап</p>
                    <div className="mt-3 space-y-2 text-xs text-zinc-300">
                      <p>Камера: {proWizard.camera}</p>
                      <p>Объектив: {proWizard.lens_profile}</p>
                      <p>Фокусное: {proWizard.focal_mm} мм</p>
                      <p>Диафрагма: {proWizard.aperture}</p>
                      <p>Свет: {proWizard.lighting_style}</p>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100"
                        onClick={() => {
                          setProPromptMode("compact");
                          setProPromptDrawerOpen(true);
                        }}
                      >
                        Показать промпт
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950"
                        onClick={() => void handleProDrawerCopy()}
                      >
                        Скопировать промпт
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100"
                        onClick={handleProAddToPack}
                      >
                        Добавить в пакет
                      </button>
                    </div>
                  </aside>
                </div>
              )}
            </div>

            {studioMode === "beginner" ? (
              <section className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold tracking-tight">Варианты</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {generatedPack ? <p className="text-xs text-zinc-400">{formatDate(generatedPack.created_at)}</p> : null}
                    <button
                      type="button"
                      data-testid="generate-4-variations-btn"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100 transition hover:bg-white/[0.14]"
                      onClick={() => handleGeneratePack(studioSetup)}
                    >
                      4 варианта
                    </button>
                  </div>
                </div>
                {generatedPack ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {generatedPack.variants.map((variant) => (
                      <article key={variant.id} data-testid="pack-variant-card" className="rounded-2xl border border-white/10 bg-[#0d0e12] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{variant.label}</p>
                            <p className="text-xs text-zinc-400">{variant.summary}</p>
                          </div>
                          <button
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200 hover:bg-white/20"
                            onClick={() => void handleCopyText(variantPrompt(variant))}
                          >
                            Скопировать
                          </button>
                        </div>
                        <pre className="mt-2 max-h-28 overflow-auto rounded-xl border border-white/10 bg-[#0b0c10] p-2 text-[11px] whitespace-pre-wrap text-zinc-300">
                          {variantPrompt(variant)}
                        </pre>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">Нажми «4 варианта», чтобы получить base + 3 безопасные версии.</p>
                )}
              </section>
            ) : null}
          </section>
        ) : null}

        {activeTab === "packs" ? (
          <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">Наборы промптов</h2>
              <p className="mt-1 text-sm text-zinc-400">История наборов, быстрый возврат в Студию и единый экспорт.</p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#101116] p-3">
                <p className="text-sm font-semibold text-zinc-100">Как использовать (30 секунд)</p>
                <ol className="mt-2 space-y-1 text-xs text-zinc-400">
                  <li>1. Copy Base</li>
                  <li>2. Вставь в модель</li>
                  <li>3. Используй Detail/Blur/Drama версии при необходимости</li>
                </ol>
                <button
                  type="button"
                  data-testid="copy-all-pack-btn"
                  className="mt-3 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100 transition hover:bg-white/[0.14]"
                  onClick={() => void handleCopyAllPack()}
                >
                  Copy all
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {packs.map((pack) => (
                  <article
                    key={pack.id}
                    data-testid="pack-history-item"
                    className={`rounded-2xl border p-3 transition ${
                      activePackId === pack.id ? "border-white/35 bg-white/[0.08]" : "border-white/10 bg-[#101116]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-zinc-100">
                          {pack.setup_snapshot.meta?.human_title ?? pack.setup_snapshot.preset_title ?? "Custom setup"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDate(pack.created_at)}</p>
                        <div className="mt-1 flex gap-1">
                          {pack.setup_snapshot.meta?.category ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                              {CATEGORY_LABELS[pack.setup_snapshot.meta.category as keyof typeof CATEGORY_LABELS] ?? pack.setup_snapshot.meta.category}
                            </span>
                          ) : null}
                          {pack.setup_snapshot.meta?.goal ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                              {GOAL_LABELS[pack.setup_snapshot.meta.goal as GoalTag] ?? pack.setup_snapshot.meta.goal}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200" onClick={() => setActivePackId(pack.id)}>Открыть</button>
                        <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200" onClick={() => openPackInStudio(pack)}>В Студию</button>
                        <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200" onClick={() => handleExportJson(pack)}>JSON</button>
                        <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200" onClick={() => handleExportCsv(pack)}>CSV</button>
                      </div>
                    </div>
                  </article>
                ))}
                {packs.length === 0 ? <p className="text-sm text-zinc-400">Пока нет наборов. Собери первый в Студии.</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold tracking-tight">Просмотр набора</h3>
                <span className="rounded-full border border-white/15 bg-[#101116] px-3 py-1 text-xs text-zinc-300">Nano Banana Pro</span>
              </div>

              {activePack ? (
                <div className="mt-3 space-y-3">
                  {activePack.variants.map((variant) => (
                    <article key={variant.id} className="rounded-2xl border border-white/10 bg-[#0d0e12] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{variant.label}</p>
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => void handleCopyText(variantPrompt(variant))}
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-white/10 bg-[#0b0c10] p-2 text-[11px] whitespace-pre-wrap text-zinc-300">
                        {variantPrompt(variant)}
                      </pre>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">Выбери набор слева, чтобы увидеть варианты.</p>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "reference" ? (
          <section className="mt-4 rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Справочник</h2>
            <p className="mt-1 text-sm text-zinc-400">Контекстная помощь по ключевым терминам и быстрым применениям.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {STUDIO_TERM_GUIDE.map((term) => (
                <article key={term.id} className="rounded-2xl border border-white/10 bg-[#0d0e12] p-4">
                  <p className="text-sm font-semibold text-zinc-100">{term.term}</p>
                  <p className="mt-2 text-xs text-zinc-400">Что это: {term.what}</p>
                  <p className="mt-1 text-xs text-zinc-400">Влияние: {term.impact}</p>
                  <p className="mt-1 text-xs text-zinc-400">Когда использовать: {term.when}</p>
                  <p className="mt-2 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-zinc-200">{term.microcopy}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-zinc-100"
                      onClick={() => applyReferenceTerm(term.id)}
                    >
                      Применить
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-zinc-100"
                      onClick={() => setActiveTermId(term.id)}
                    >
                      Подробнее
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {activeDetailsPreset && activeDetailsPreview ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6"
          data-testid="task-details-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsPresetId(null);
            }
          }}
        >
          <article
            ref={detailsPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Детали задачи"
            tabIndex={-1}
            className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0d0f14] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-zinc-100">{activeDetailsPreset.humanTitle}</h3>
                <p className="mt-1 text-xs text-zinc-400">Что вы получите</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200"
                onClick={() => setDetailsPresetId(null)}
              >
                Закрыть
              </button>
            </div>

            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              {activeDetailsPreset.resultChips.slice(0, 3).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            <div className="mt-3 rounded-2xl border border-white/10 bg-[#0a0c10] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Промпт (компакт)</p>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-[#05070b] p-2 text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {detailsPromptMode === "compact" ? withCompactLines(activeDetailsPreview.compact) : activeDetailsPreview.full}
              </pre>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950"
                onClick={() => void handleCopyText(activeDetailsPreview.compact)}
              >
                Копировать
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100"
                onClick={() => setDetailsPromptMode((current) => (current === "compact" ? "full" : "compact"))}
              >
                Полный
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100"
                onClick={() => handleGeneratePack(buildSetupForPreset(activeDetailsPreset))}
              >
                Варианты
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100"
                onClick={() => {
                  openProFromPreset(activeDetailsPreset);
                  setActiveTab("studio");
                  setDetailsPresetId(null);
                }}
              >
                Открыть Pro
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {postCopyPanel && activePostCopyPreset && activePostCopyPreview ? (
        <aside
          ref={postCopyPanelRef}
          data-testid="post-copy-sheet"
          role="dialog"
          aria-modal="false"
          aria-label="Панель после копирования"
          tabIndex={-1}
          className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-white/15 bg-[#0d0f14]/95 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:top-6 md:w-[420px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Скопировано ✅</p>
              <p className="text-xs text-zinc-400">{activePostCopyPreset.humanTitle}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200"
              onClick={() => setPostCopyPanel(null)}
            >
              Закрыть
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              data-testid="sheet-show-prompt"
              className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
              onClick={() =>
                setPostCopyPanel((current) => (current ? { ...current, showPrompt: !current.showPrompt, promptMode: "compact" } : current))
              }
            >
              Показать промпт
            </button>
            <button
              type="button"
              data-testid="sheet-variations"
              className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
              onClick={() => handleGeneratePack(buildSetupForPreset(activePostCopyPreset))}
            >
              4 варианта
            </button>
            <button
              type="button"
              data-testid="sheet-open-pro"
              className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
              onClick={() => {
                openProFromPreset(activePostCopyPreset);
                setActiveTab("studio");
                setPostCopyPanel(null);
              }}
            >
              Открыть Pro
            </button>
          </div>

          {postCopyPanel.showPrompt ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-[#080a0f] p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="sheet-mode-compact"
                  data-active={postCopyPanel.promptMode === "compact" ? "true" : "false"}
                  className={`rounded-full px-3 py-1 text-xs ${postCopyPanel.promptMode === "compact" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"}`}
                  onClick={() => setPostCopyPanel((current) => (current ? { ...current, promptMode: "compact" } : current))}
                >
                  Компакт
                </button>
                <button
                  type="button"
                  data-testid="sheet-mode-full"
                  data-active={postCopyPanel.promptMode === "full" ? "true" : "false"}
                  className={`rounded-full px-3 py-1 text-xs ${postCopyPanel.promptMode === "full" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"}`}
                  onClick={() => setPostCopyPanel((current) => (current ? { ...current, promptMode: "full" } : current))}
                >
                  Полный
                </button>
              </div>

              <pre data-testid="sheet-prompt-preview" className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#04060a] p-2 text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {postCopyPanel.promptMode === "compact"
                  ? withCompactLines(activePostCopyPreview.compact)
                  : activePostCopyPreview.full}
              </pre>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  data-testid="sheet-copy-compact"
                  className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                  onClick={() => void handleCopyText(activePostCopyPreview.compact)}
                >
                  Копировать компакт
                </button>
                <button
                  type="button"
                  data-testid="sheet-copy-full"
                  className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                  onClick={() => void handleCopyText(activePostCopyPreview.full)}
                >
                  Копировать полный
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      ) : null}

      {activeTab === "studio" && studioMode === "pro" ? (
        <aside className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/15 bg-[#0d0f14]/95 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl xl:hidden">
          <p className="text-[11px] text-zinc-400">Текущий сетап: {proWizard.camera} • {proWizard.lens_profile} • {proWizard.focal_mm} мм</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/[0.06] px-2 py-2 text-[11px] text-zinc-100"
              onClick={() => {
                setProPromptMode("compact");
                setProPromptDrawerOpen(true);
              }}
            >
              Показать промпт
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-2 py-2 text-[11px] font-semibold text-zinc-950"
              onClick={() => void handleProDrawerCopy()}
            >
              Скопировать
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/[0.06] px-2 py-2 text-[11px] text-zinc-100"
              onClick={handleProAddToPack}
            >
              В пакет
            </button>
          </div>
        </aside>
      ) : null}

      {proPromptDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setProPromptDrawerOpen(false);
            }
          }}
        >
          <aside
            ref={proPromptDrawerRef}
            data-testid="pro-prompt-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Промпт Pro режима"
            tabIndex={-1}
            className="fixed inset-x-3 bottom-3 max-h-[88vh] overflow-auto rounded-2xl border border-white/15 bg-[#0d0f14] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.5)] md:inset-x-auto md:bottom-6 md:right-6 md:top-6 md:w-[460px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Nano Banana Pro</p>
                <p className="text-xs text-zinc-400">Промпт скрыт на странице и открыт только по запросу.</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200"
                onClick={() => setProPromptDrawerOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              <label className="text-[11px] text-zinc-400">
                SCENE GOAL
                <input
                  type="text"
                  value={proWizard.scene.goal}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1.5 text-xs text-zinc-100"
                  onChange={(event) => handleProSceneUpdate("goal", event.target.value)}
                />
              </label>
              <label className="text-[11px] text-zinc-400">
                SCENE ACTION
                <input
                  type="text"
                  value={proWizard.scene.action}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1.5 text-xs text-zinc-100"
                  onChange={(event) => handleProSceneUpdate("action", event.target.value)}
                />
              </label>
              <label className="text-[11px] text-zinc-400">
                SCENE ENVIRONMENT
                <input
                  type="text"
                  value={proWizard.scene.environment}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1.5 text-xs text-zinc-100"
                  onChange={(event) => handleProSceneUpdate("environment", event.target.value)}
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${proPromptMode === "compact" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"}`}
                onClick={() => setProPromptMode("compact")}
              >
                Compact
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${proPromptMode === "full" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300"}`}
                onClick={() => setProPromptMode("full")}
              >
                Full
              </button>
            </div>

            <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#07090d] p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-300">
              {proPromptMode === "compact" ? withCompactLines(proPromptPreview.compactPrompt) : proPromptPreview.fullPrompt}
            </pre>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                onClick={() => void handleCopyText(proPromptPreview.compactPrompt)}
              >
                Copy compact
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                onClick={() => void handleCopyText(proPromptPreview.fullPrompt)}
              >
                Copy full
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                onClick={() => handleGeneratePack(proSetup)}
              >
                4 варианта
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
                onClick={() => setProPromptDrawerOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100"
              onClick={() => setProAdvancedOpen((current) => !current)}
            >
              Advanced toggles
            </button>

            {proAdvancedOpen ? (
              <div className="mt-2 rounded-xl border border-white/10 bg-[#080a0f] p-3">
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={proWizard.locks.characterLock} onChange={() => handleProLockToggle("characterLock")} />
                    characterLock
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={proWizard.locks.styleLock} onChange={() => handleProLockToggle("styleLock")} />
                    styleLock
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={proWizard.locks.compositionLock} onChange={() => handleProLockToggle("compositionLock")} />
                    compositionLock
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={proWizard.locks.noTextStrict} onChange={() => handleProLockToggle("noTextStrict")} />
                    noTextStrict
                  </label>
                </div>

                <label className="mt-3 block text-[11px] text-zinc-400">
                  Negative constraints
                  <textarea
                    value={proWizard.locks.negativeLock.join(", ")}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1.5 text-xs text-zinc-100"
                    onChange={(event) => handleProNegativeLockChange(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {activePreset ? (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 px-4 py-6"
          data-testid="gallery-modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActivePreset(null);
            }
          }}
        >
          <div className="max-h-full w-full max-w-5xl overflow-auto rounded-[30px] border border-white/15 bg-[#07080a] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.22em] text-zinc-500">Gallery Reference</p>
                <h3 className="font-display mt-1 text-3xl font-semibold tracking-tight">{activePreset.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{activePreset.description}</p>
              </div>
              <button className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200" onClick={() => setActivePreset(null)}>
                Закрыть
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <img src={activePreset.image_url} alt={activePreset.title} className="h-full min-h-72 w-full rounded-3xl border border-white/10 object-cover" />
              <div>
                <div className="inline-flex rounded-full border border-white/15 bg-[#101116] px-3 py-1 text-xs text-zinc-300">Nano Banana Pro</div>

                <pre className="mt-3 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-[#0d0e12] p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-200">
                  {activePreset.example_prompts.nano}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950"
                    onClick={() => void handleCopyText(activePreset.example_prompts.nano)}
                  >
                    Скопировать промпт
                  </button>
                  <button
                    className="rounded-full bg-white/10 px-4 py-2 text-sm text-zinc-200"
                    onClick={() => {
                      setActivePreset(null);
                      setActiveTab("studio");
                      setToast({ kind: "success", text: "Референс открыт в Студии" });
                    }}
                  >
                    Применить в Студию
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTerm ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveTermId(null);
            }
          }}
        >
          <article className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0d0f14] p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-display text-xl text-zinc-100">{activeTerm.term}</h4>
              <button className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200" onClick={() => setActiveTermId(null)}>
                Закрыть
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{activeTerm.what}</p>
            <p className="mt-1 text-xs text-zinc-400">Влияние: {activeTerm.impact}</p>
            <p className="mt-1 text-xs text-zinc-400">Когда использовать: {activeTerm.when}</p>
            <p className="mt-2 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-zinc-200">{activeTerm.microcopy}</p>
          </article>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-xl border border-white/15 bg-[#111217]/95 px-4 py-2 text-sm text-zinc-100 shadow-[0_12px_30px_rgba(0,0,0,0.45)] animate-toast-fade">
          <span className={toast.kind === "error" ? "text-rose-300" : "text-emerald-300"}>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}
