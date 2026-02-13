"use client";

import { useEffect, useMemo, useState } from "react";

import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import { DEFAULT_GALLERY_PRESETS } from "@/lib/studio/presets";
import {
  BEGINNER_CATEGORIES,
  CATEGORY_LABELS,
  GOAL_LABELS,
  STUDIO_CAMERA_LIBRARY,
  STUDIO_LIGHT_SETUPS,
  STUDIO_TASK_PRESETS,
  STUDIO_TERM_GUIDE,
  type GoalTag,
  type SlidersMapping,
  type StudioTaskPreset,
  type TechSettings,
} from "@/lib/studio/catalog";
import { studioPresetCollectionSchema } from "@/lib/studio/presetSchema";
import { mapSlidersToTech, sliderLevelLabel } from "@/lib/studio/sliderMapping";
import type { Core6Setup, GalleryPreset, PromptPack, PromptPackVariant, StudioSetup } from "@/lib/studio/types";

type TabKey = "gallery" | "studio" | "packs" | "reference";
type AdvancedMode = "simple" | "pro";
type SceneKey = "goal" | "action" | "environment";

type SceneDraft = {
  goal: string;
  action: string;
  environment: string;
};

const VALIDATED_TASK_PRESETS = studioPresetCollectionSchema.parse(STUDIO_TASK_PRESETS);

const STORAGE_KEYS = {
  tab: "prompt-copilot/cinema/tab",
  packs: "prompt-copilot/cinema/packs",
};

const GALLERY_CHUNK_SIZE = 8;

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

function nextSceneLine(lines: string[], current: string): string {
  if (lines.length === 0) {
    return current;
  }

  if (lines.length === 1) {
    return lines[0] ?? current;
  }

  const currentIndex = lines.findIndex((line) => line === current);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % lines.length;
  return lines[nextIndex] ?? current;
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
  sliders: SlidersMapping;
  tech: TechSettings;
}): StudioSetup {
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
      negative_lock: input.preset.locks.negativeLock.join(", "),
      text_policy: input.preset.locks.noTextStrict ? "NO-TEXT STRICT" : "TEXT-ALLOWED",
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

function levelToResult(level: ReturnType<typeof sliderLevelLabel>, type: "detail" | "blur"): string {
  if (type === "detail") {
    if (level === "Низко") {
      return "мягче";
    }
    if (level === "Средне") {
      return "сбалансированная читаемость";
    }
    return "высокая читаемость";
  }

  if (level === "Низко") {
    return "фон читается";
  }
  if (level === "Средне") {
    return "умеренное размытие";
  }
  return "сильное размытие";
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

  const [selectedPresetId, setSelectedPresetId] = useState(starterPreset.id);
  const [sliders, setSliders] = useState<SlidersMapping>({ ...starterPreset.sliderDefaults });
  const [sceneDraft, setSceneDraft] = useState<SceneDraft>(() => makeInitialSceneDraft(starterPreset));
  const [techOverrides, setTechOverrides] = useState<Partial<TechSettings>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("simple");
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [expandedTechChips, setExpandedTechChips] = useState<Record<string, boolean>>({});

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

  const mappedTech = useMemo(() => {
    return mapSlidersToTech({
      base: selectedPreset.defaults,
      category: selectedPreset.category,
      goal: selectedPreset.goal,
      sliders,
    });
  }, [selectedPreset, sliders]);

  const effectiveTech = useMemo(() => {
    return {
      ...mappedTech,
      ...techOverrides,
    };
  }, [mappedTech, techOverrides]);

  const studioSetup = useMemo(() => {
    return makeSetup({
      preset: selectedPreset,
      sliders,
      scene: sceneDraft,
      tech: effectiveTech,
    });
  }, [effectiveTech, sceneDraft, selectedPreset, sliders]);

  const livePreview = useMemo(() => {
    return generatePromptPack({ setup: studioSetup, packId: "preview", createdAt: "2026-02-13T00:00:00.000Z" });
  }, [studioSetup]);

  const promptPreview = livePreview.variants[0] ? variantPrompt(livePreview.variants[0]) : "";

  const activePack = useMemo(() => {
    if (!activePackId) {
      return packs[0] ?? null;
    }
    return packs.find((pack) => pack.id === activePackId) ?? null;
  }, [activePackId, packs]);

  const lightOptions = useMemo(
    () => Array.from(new Set(STUDIO_LIGHT_SETUPS.map((item) => item.name))),
    [],
  );

  const lensOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...VALIDATED_TASK_PRESETS.map((preset) => preset.defaults.lens_profile),
          "Spherical Prime",
          "Master Prime",
          "Macro 100mm",
          "Wide Prime",
          "Telephoto Prime",
        ]),
      ),
    [],
  );

  const apertureOptions = ["f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;

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
    const query = galleryQuery.trim().toLowerCase();
    if (!query) {
      return VALIDATED_TASK_PRESETS;
    }

    return VALIDATED_TASK_PRESETS.filter((preset) => {
      const searchable = [
        preset.humanTitle,
        preset.benefit,
        preset.category,
        preset.goal,
        ...preset.resultChips,
        preset.defaults.camera,
        preset.defaults.lens_profile,
        preset.defaults.lighting,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [galleryQuery]);

  const currentResultSummary = useMemo(() => {
    const detailLevel = sliderLevelLabel(sliders.detail);
    return `Текущий результат: ${selectedPreset.resultChips[0]} • ${detailLevel.toLowerCase()} detail • ${effectiveTech.lighting}`;
  }, [effectiveTech.lighting, selectedPreset.resultChips, sliders.detail]);

  const detailLevel = sliderLevelLabel(sliders.detail);
  const blurLevel = sliderLevelLabel(sliders.backgroundBlur);
  const lightLevel = sliderLevelLabel(sliders.lightDrama);

  const activeTerm = STUDIO_TERM_GUIDE.find((item) => item.id === activeTermId) ?? null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(packs));
  }, [packs]);

  useEffect(() => {
    setVisiblePresetCount(GALLERY_CHUNK_SIZE);
  }, [galleryCategory, galleryQuery]);

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

  const resetSelectionToPresetDefaults = (preset: StudioTaskPreset) => {
    setSliders({ ...preset.sliderDefaults });
    setSceneDraft(makeInitialSceneDraft(preset));
    setTechOverrides({});
  };

  const applyTaskPreset = (preset: StudioTaskPreset) => {
    setSelectedPresetId(preset.id);
    resetSelectionToPresetDefaults(preset);
    setToast({ kind: "success", text: `Применено: ${preset.humanTitle}` });
  };

  const handleSliderChange = (key: keyof SlidersMapping, rawValue: string) => {
    const value = Number(rawValue);
    setSliders((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(100, Math.round(value))),
    }));
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", text: "Скопировано в буфер обмена" });
    } catch {
      setToast({ kind: "error", text: "Не удалось скопировать текст" });
    }
  };

  const handleGeneratePack = () => {
    const pack = generatePromptPack({ setup: studioSetup });
    setGeneratedPack(pack);
    setPacks((current) => [pack, ...current].slice(0, 60));
    setActivePackId(pack.id);
    setToast({ kind: "success", text: "Собрано 4 варианта" });
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

  const updateSceneFromTemplate = (key: SceneKey, value: string) => {
    setSceneDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const rotateSceneTemplate = (key: SceneKey) => {
    const lines = selectedPreset.sceneTemplates[key];
    setSceneDraft((current) => ({
      ...current,
      [key]: nextSceneLine(lines, current[key]),
    }));
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

  const toggleTechChips = (id: string) => {
    setExpandedTechChips((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const tabClass = (tab: TabKey): string =>
    `rounded-full px-5 py-2 text-[15px] font-medium transition ${
      activeTab === tab ? "bg-white text-[#0f0f12]" : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]"
    }`;

  const galleryImageHeights = ["h-44", "h-72", "h-56", "h-80", "h-52", "h-64"] as const;

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
                  onChange={(event) => setGalleryQuery(event.target.value)}
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
                  onClick={() => setGalleryCategory(category)}
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
          <section className="mt-4 space-y-4 pb-20">
            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">Студия</h2>
                  <p className="mt-1 text-sm text-zinc-400">Открой задачу, подстрой вид и собери production-safe промпт за 20–30 секунд.</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Beginner Mode
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {BEGINNER_CATEGORIES.map((category) => (
                  <span key={category} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                    {CATEGORY_LABELS[category]}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.28fr_0.92fr]">
                <div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTaskPresets.map((preset) => {
                      const isOpen = Boolean(expandedTechChips[preset.id]);
                      return (
                        <article key={preset.id} data-testid="studio-task-card" className="rounded-2xl border border-white/10 bg-[#0d0f14] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-lg text-zinc-100">{preset.humanTitle}</p>
                            <div className="flex gap-1">
                              {preset.recommended ? (
                                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-200">Recommended</span>
                              ) : null}
                              {preset.safeDefault ? (
                                <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] text-sky-200">Safe default</span>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">{preset.benefit}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {preset.resultChips.map((chip) => (
                              <span key={`${preset.id}-${chip}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                                {chip}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            data-testid={`studio-task-open-${preset.id}`}
                            className="mt-3 w-full rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-100 transition hover:bg-white/[0.16]"
                            onClick={() => applyTaskPreset(preset)}
                          >
                            Открыть
                          </button>
                          <button
                            type="button"
                            data-testid={`task-show-params-${preset.id}`}
                            className="mt-2 text-xs text-zinc-400 underline-offset-2 transition hover:text-zinc-200 hover:underline"
                            onClick={() => toggleTechChips(preset.id)}
                          >
                            Показать параметры
                          </button>
                          <div
                            data-testid={`task-tech-chips-${preset.id}`}
                            hidden={!isOpen}
                            className="mt-2 flex flex-wrap gap-1.5"
                          >
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                              {preset.defaults.camera}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                              {preset.defaults.lens_profile}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                              {preset.defaults.focal_mm} мм
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                              {preset.defaults.aperture}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">
                              {preset.defaults.lighting}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <aside data-testid="result-panel" className="sticky top-6 h-fit rounded-2xl border border-white/12 bg-[#0c0d11] p-4">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">Что получится</h3>
                  <ul data-testid="result-bullets" className="mt-2 space-y-1 text-sm text-zinc-300">
                    <li>Фактура: {levelToResult(detailLevel, "detail")}</li>
                    <li>Фон: {levelToResult(blurLevel, "blur")}</li>
                    <li>Свет: {effectiveTech.lighting}</li>
                  </ul>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#101217] p-3">
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Подстрой вид</p>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                          <span>Детали</span>
                          <span>{detailLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Мягче</span>
                          <span>Супер-детали</span>
                        </div>
                        <input
                          data-testid="slider-detail"
                          type="range"
                          min={0}
                          max={100}
                          value={sliders.detail}
                          onChange={(event) => handleSliderChange("detail", event.target.value)}
                          className="mt-1 w-full accent-white"
                        />
                      </label>

                      <label className="block">
                        <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                          <span>Отделение от фона</span>
                          <span>{blurLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Фон читается</span>
                          <span>Сильное размытие</span>
                        </div>
                        <input
                          data-testid="slider-background-blur"
                          type="range"
                          min={0}
                          max={100}
                          value={sliders.backgroundBlur}
                          onChange={(event) => handleSliderChange("backgroundBlur", event.target.value)}
                          className="mt-1 w-full accent-white"
                        />
                      </label>

                      <label className="block">
                        <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                          <span>Контраст света</span>
                          <span>{lightLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Мягко</span>
                          <span>Драма</span>
                        </div>
                        <input
                          data-testid="slider-light-drama"
                          type="range"
                          min={0}
                          max={100}
                          value={sliders.lightDrama}
                          onChange={(event) => handleSliderChange("lightDrama", event.target.value)}
                          className="mt-1 w-full accent-white"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#101217] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Preview prompt</p>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300">Nano Banana Pro</span>
                    </div>
                    <pre className="mt-2 max-h-44 overflow-auto rounded-lg border border-white/10 bg-[#0b0c10] p-2 text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                      {promptExpanded ? promptPreview : promptPreview.split("\n").slice(0, 7).join("\n")}
                    </pre>
                    <button
                      type="button"
                      className="mt-2 text-xs text-zinc-400 underline-offset-2 transition hover:text-zinc-200 hover:underline"
                      onClick={() => setPromptExpanded((value) => !value)}
                    >
                      {promptExpanded ? "Свернуть" : "Показать полностью"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      data-testid="copy-prompt-btn"
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      onClick={() => void handleCopyText(promptPreview)}
                    >
                      Copy prompt
                    </button>
                    <button
                      type="button"
                      data-testid="generate-4-variations-btn"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/[0.14]"
                      onClick={handleGeneratePack}
                    >
                      4 варианта
                    </button>
                    <button
                      type="button"
                      data-testid="open-advanced-btn"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/[0.14]"
                      onClick={() => setAdvancedOpen(true)}
                    >
                      Точная настройка
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/[0.14]"
                      onClick={handleGeneratePack}
                    >
                      Собрать Prompt Pack (4)
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#101217] p-3">
                    <p className="text-xs text-zinc-400">{currentResultSummary}</p>
                    <p data-testid="current-setup-line" className="mt-1 text-xs text-zinc-300">
                      {effectiveTech.camera} • {effectiveTech.lens_profile} • {effectiveTech.focal_mm} мм • {effectiveTech.aperture} • {effectiveTech.lighting}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1 text-xs text-zinc-200"
                        onClick={() => setAdvancedOpen(true)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1 text-xs text-zinc-200"
                        onClick={() => {
                          resetSelectionToPresetDefaults(selectedPreset);
                          setToast({ kind: "success", text: "Сетап сброшен" });
                        }}
                      >
                        Сбросить
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1 text-xs text-zinc-200"
                        onClick={() => setToast({ kind: "success", text: "Пресет сохранен" })}
                      >
                        Сохранить пресет
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <section className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold tracking-tight">Варианты</h3>
                {generatedPack ? <p className="text-xs text-zinc-400">{formatDate(generatedPack.created_at)}</p> : null}
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
                          Copy
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

      {advancedOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 md:p-6">
          <section data-testid="advanced-panel" className="max-h-[95vh] w-full max-w-[1280px] overflow-auto rounded-3xl border border-white/15 bg-[#07080a] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">Точная настройка</h3>
                <p className="mt-1 text-sm text-zinc-400">Simple — для быстрого результата, Pro — для точного контроля.</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs text-zinc-100"
                onClick={() => setAdvancedOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                data-testid="advanced-mode-simple"
                className={`rounded-full px-4 py-2 text-xs transition ${
                  advancedMode === "simple" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.08]"
                }`}
                onClick={() => setAdvancedMode("simple")}
              >
                Simple
              </button>
              <button
                type="button"
                data-testid="advanced-mode-pro"
                className={`rounded-full px-4 py-2 text-xs transition ${
                  advancedMode === "pro" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/[0.08]"
                }`}
                onClick={() => setAdvancedMode("pro")}
              >
                Pro
              </button>
            </div>

            {advancedMode === "simple" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(Object.keys(selectedPreset.sceneTemplates) as SceneKey[]).map((key) => (
                  <article key={key} className="rounded-2xl border border-white/10 bg-[#0d0f14] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {key === "goal" ? "Цель сцены" : key === "action" ? "Действие сцены" : "Окружение"}
                    </p>
                    <select
                      className="mt-2 w-full rounded-lg border border-white/15 bg-[#0b0d11] px-2 py-2 text-sm text-zinc-100"
                      value={sceneDraft[key]}
                      onChange={(event) => updateSceneFromTemplate(key, event.target.value)}
                    >
                      {selectedPreset.sceneTemplates[key].map((line) => (
                        <option key={`${key}-${line}`} value={line}>
                          {line}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="mt-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-zinc-100"
                      onClick={() => rotateSceneTemplate(key)}
                    >
                      Перегенерировать формулировку
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Камера</span>
                  <select
                    data-testid="pro-camera-select"
                    className="w-full rounded-lg border border-white/15 bg-[#0b0d11] px-2 py-2 text-sm text-zinc-100"
                    value={effectiveTech.camera}
                    onChange={(event) => setTechOverrides((current) => ({ ...current, camera: event.target.value }))}
                  >
                    {STUDIO_CAMERA_LIBRARY.map((camera) => (
                      <option key={camera.name} value={camera.name}>
                        {camera.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Объектив</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-[#0b0d11] px-2 py-2 text-sm text-zinc-100"
                    value={effectiveTech.lens_profile}
                    onChange={(event) => setTechOverrides((current) => ({ ...current, lens_profile: event.target.value }))}
                  >
                    {lensOptions.map((lens) => (
                      <option key={lens} value={lens}>
                        {lens}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Фокусное</span>
                  <input
                    type="range"
                    min={14}
                    max={200}
                    value={effectiveTech.focal_mm}
                    onChange={(event) => setTechOverrides((current) => ({ ...current, focal_mm: Number(event.target.value) }))}
                    className="w-full accent-white"
                  />
                  <p className="text-xs text-zinc-400">{effectiveTech.focal_mm} мм</p>
                </label>

                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Диафрагма</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-[#0b0d11] px-2 py-2 text-sm text-zinc-100"
                    value={effectiveTech.aperture}
                    onChange={(event) => setTechOverrides((current) => ({ ...current, aperture: event.target.value }))}
                  >
                    {apertureOptions.map((aperture) => (
                      <option key={aperture} value={aperture}>
                        {aperture}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Свет</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-[#0b0d11] px-2 py-2 text-sm text-zinc-100"
                    value={effectiveTech.lighting}
                    onChange={(event) => setTechOverrides((current) => ({ ...current, lighting: event.target.value }))}
                  >
                    {lightOptions.map((light) => (
                      <option key={light} value={light}>
                        {light}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <article className="mt-4 rounded-2xl border border-white/10 bg-[#0d0f14] p-3">
              <p className="text-sm font-semibold text-zinc-100">Почему это работает</p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {selectedPreset.whyWorks.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      ) : null}

      {activePreset ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 px-4 py-6" data-testid="gallery-modal">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6">
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
