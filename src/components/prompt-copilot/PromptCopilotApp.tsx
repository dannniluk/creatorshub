"use client";

import { useEffect, useMemo, useState } from "react";

import { DEFAULT_GALLERY_PRESETS } from "@/lib/studio/presets";
import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import {
  STUDIO_CAMERA_LIBRARY,
  STUDIO_CATEGORIES,
  STUDIO_FOCAL_LENGTH_GUIDE,
  STUDIO_LIGHT_SETUPS,
  STUDIO_TASK_PRESETS,
  type StudioCatalogCamera,
  type StudioTaskPreset,
} from "@/lib/studio/catalog";
import type {
  Core6Setup,
  GalleryPreset,
  PromptPack,
  PromptPackVariant,
  StudioSetup,
} from "@/lib/studio/types";

type TabKey = "gallery" | "studio" | "packs" | "reference";

const STORAGE_KEYS = {
  setup: "prompt-copilot/cinema/setup",
  packs: "prompt-copilot/cinema/packs",
  tab: "prompt-copilot/cinema/tab",
};

const GALLERY_CHUNK_SIZE = 8;

const CAMERA_FORMAT_OPTIONS = [
  "Digital Full Frame",
  "ARRI ALEXA Mini LF",
  "RED V-RAPTOR 8K VV",
  "Sony A1",
  "Canon EOS R5",
  "Nikon Z8",
  "Fujifilm GFX100 II",
  "Blackmagic URSA Mini Pro 12K",
  "Hasselblad X2D 100C",
  "Classic 16mm Film",
] as const;

const LENS_OPTIONS = [
  "Spherical Prime",
  "Wide Prime",
  "Anamorphic",
  "Anamorphic Prime",
  "Vintage Prime",
  "Master Prime",
  "Zoom",
  "Zoom Cine",
  "Macro 100mm",
  "Tilt-Shift",
  "Telephoto Prime",
] as const;

const APERTURE_OPTIONS = ["f/1.2", "f/1.4", "f/1.8", "f/2.0", "f/2.8", "f/4", "f/5.6", "f/8"] as const;

const LIGHTING_OPTIONS = [
  "Мягкий ключ с деликатным заполнением",
  "Кинематографичный направленный ключ",
  "Контровой свет с плотным контрастом",
  "Естественный свет через облачность",
  "Практические источники в кадре",
  "Butterfly / Paramount",
  "Rembrandt",
  "Split lighting",
  "Golden hour backlight",
  "Blue hour ambient",
  "Softbox overhead",
  "Beauty dish frontal",
] as const;

type StudioViewKey = "tasks" | "cameras" | "reference";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function createSetupFromPreset(preset: GalleryPreset): StudioSetup {
  return {
    preset_id: preset.id,
    preset_title: preset.title,
    scene_goal: `Передать настроение «${preset.mood}» через ${preset.shot_type} кадр`,
    scene_action: "Главный герой уверенно движется в кадре",
    scene_environment: "Кинематографичная локация с читаемой глубиной",
    core6: { ...preset.core6_defaults },
    locked_core: { ...preset.locked_core_defaults },
  };
}

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
  return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function toCsv(packs: PromptPack[]): string {
  const headers = ["pack_id", "created_at", "preset_id", "preset_title", "variant_id", "variant_label", "prompt_nano"];

  const rows = packs.flatMap((pack) =>
    pack.variants.map((variant) => [
      pack.id,
      pack.created_at,
      pack.setup_snapshot.preset_id ?? "",
      pack.setup_snapshot.preset_title,
      variant.id,
      variant.label,
      variant.prompt_nano,
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

export default function PromptCopilotApp() {
  const initialPreset = DEFAULT_GALLERY_PRESETS[0] ?? null;
  const defaultSetup: StudioSetup = initialPreset
    ? createSetupFromPreset(initialPreset)
    : {
        preset_id: null,
        preset_title: "",
        scene_goal: "",
        scene_action: "",
        scene_environment: "",
        core6: {
          camera_format: CAMERA_FORMAT_OPTIONS[0],
          lens_type: LENS_OPTIONS[0],
          focal_length_mm: 35,
          aperture: APERTURE_OPTIONS[2],
          lighting_style: LIGHTING_OPTIONS[1],
          camera_movement: "Статичный кадр",
        },
        locked_core: {
          character_lock: "",
          style_lock: "",
          composition_lock: "",
          negative_lock: "",
          text_policy: "NO-TEXT STRICT",
        },
      };

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") {
      return "gallery";
    }

    return safeParse<TabKey>(localStorage.getItem(STORAGE_KEYS.tab)) ?? "gallery";
  });
  const [galleryQuery, setGalleryQuery] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("Все");
  const [studioView, setStudioView] = useState<StudioViewKey>("tasks");
  const [studioQuery, setStudioQuery] = useState("");
  const [studioCategory, setStudioCategory] = useState<(typeof STUDIO_CATEGORIES)[number]>("Все");
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);

  const [studioSetup, setStudioSetup] = useState<StudioSetup>(() => {
    if (typeof window === "undefined") {
      return defaultSetup;
    }

    return safeParse<StudioSetup>(localStorage.getItem(STORAGE_KEYS.setup)) ?? defaultSetup;
  });

  const [packs, setPacks] = useState<PromptPack[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return safeParse<PromptPack[]>(localStorage.getItem(STORAGE_KEYS.packs)) ?? [];
  });
  const [generatedPack, setGeneratedPack] = useState<PromptPack | null>(null);

  const [visiblePresetCount, setVisiblePresetCount] = useState(GALLERY_CHUNK_SIZE);
  const [activePackId, setActivePackId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedPacks = safeParse<PromptPack[]>(localStorage.getItem(STORAGE_KEYS.packs)) ?? [];
    return storedPacks[0]?.id ?? null;
  });
  const [activePreset, setActivePreset] = useState<GalleryPreset | null>(null);

  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.setup, JSON.stringify(studioSetup));
  }, [studioSetup]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(packs));
  }, [packs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    setVisiblePresetCount(GALLERY_CHUNK_SIZE);
  }, [galleryQuery, galleryCategory]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  useEffect(() => {
    if (activeTab !== "studio") {
      setPromptDrawerOpen(false);
    }
  }, [activeTab]);

  const filteredPresets = useMemo(() => {
    const query = galleryQuery.trim().toLowerCase();
    const categoryFiltered = DEFAULT_GALLERY_PRESETS.filter((preset) => {
      if (galleryCategory === "Все") {
        return true;
      }
      return preset.category === galleryCategory;
    });

    const byQuery = query
      ? categoryFiltered.filter((preset) => {
          const joined = [preset.title, preset.mood, preset.shot_type, preset.category, preset.description, ...preset.tags]
            .join(" ")
            .toLowerCase();
          return joined.includes(query);
        })
      : categoryFiltered;

    return byQuery;
  }, [galleryQuery, galleryCategory]);

  const galleryCategories = useMemo(() => {
    const unique = Array.from(new Set(DEFAULT_GALLERY_PRESETS.map((preset) => preset.category)));
    return ["Все", ...unique];
  }, []);

  const visiblePresets = useMemo(
    () => filteredPresets.slice(0, Math.max(visiblePresetCount, GALLERY_CHUNK_SIZE)),
    [filteredPresets, visiblePresetCount],
  );

  const livePreview = useMemo(() => {
    return generatePromptPack({ setup: studioSetup, packId: "preview", createdAt: "2026-02-12T00:00:00.000Z" });
  }, [studioSetup]);

  const filteredStudioTasks = useMemo(() => {
    const query = studioQuery.trim().toLowerCase();
    const categoryFiltered =
      studioCategory === "Все" ? STUDIO_TASK_PRESETS : STUDIO_TASK_PRESETS.filter((preset) => preset.category === studioCategory);

    if (!query) {
      return categoryFiltered;
    }

    return categoryFiltered.filter((preset) => {
      const searchable = [
        preset.task,
        preset.description,
        preset.category,
        preset.camera,
        preset.lens_profile,
        preset.light,
        preset.aperture,
        String(preset.focal_mm),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [studioCategory, studioQuery]);

  const visibleStudioTasks = useMemo(() => filteredStudioTasks.slice(0, 9), [filteredStudioTasks]);

  const filteredStudioCameras = useMemo(() => {
    const query = studioQuery.trim().toLowerCase();
    if (!query) {
      return STUDIO_CAMERA_LIBRARY;
    }
    return STUDIO_CAMERA_LIBRARY.filter((camera) => {
      const searchable = [camera.name, camera.character, ...camera.best_for].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [studioQuery]);

  const activePack = useMemo(() => {
    if (!activePackId) {
      return packs[0] ?? null;
    }
    return packs.find((item) => item.id === activePackId) ?? null;
  }, [activePackId, packs]);

  const setSafeMessage = (value: string) => {
    setToast({ kind: "success", text: value });
  };

  const setSafeError = (value: string) => {
    setToast({ kind: "error", text: value });
  };

  const applyPresetToStudio = (preset: GalleryPreset) => {
    setStudioSetup(createSetupFromPreset(preset));
    setActiveTab("studio");
    setActivePreset(null);
    setSafeMessage(`Пресет «${preset.title}» применен в Студии`);
  };

  const applyTaskPreset = (preset: StudioTaskPreset) => {
    setStudioSetup((current) => ({
      ...current,
      preset_id: preset.id,
      preset_title: preset.task,
      scene_goal: `Снять задачу «${preset.task}» с приоритетом на ${preset.description.toLowerCase()}`,
      scene_action: `Сохранить чистый фокус и читаемость главного объекта для сцены «${preset.task}».`,
      scene_environment: `Категория: ${preset.category}. Подчеркнуть ${preset.light.toLowerCase()}.`,
      core6: {
        ...current.core6,
        camera_format: preset.camera,
        lens_type: preset.lens_profile,
        focal_length_mm: preset.focal_mm,
        aperture: preset.aperture,
        lighting_style: preset.light,
      },
    }));
    setSafeMessage(`Сетап «${preset.task}» применен`);
  };

  const applyCameraCombo = (camera: StudioCatalogCamera) => {
    setStudioSetup((current) => ({
      ...current,
      core6: {
        ...current.core6,
        camera_format: camera.name,
        lens_type: camera.best_combo.lens_profile,
        focal_length_mm: camera.best_combo.focal_mm,
        aperture: camera.best_combo.aperture,
        lighting_style: camera.best_combo.light,
      },
    }));
    setSafeMessage(`Камера «${camera.name}» и лучший сетап применены`);
  };

  const handleGeneratePack = () => {
    if (!studioSetup.scene_goal.trim() || !studioSetup.scene_action.trim() || !studioSetup.scene_environment.trim()) {
      setSafeError("Заполни цель, действие и окружение перед сборкой пакета");
      return;
    }

    const nextPack = generatePromptPack({ setup: studioSetup });

    setGeneratedPack(nextPack);
    setPacks((current) => [nextPack, ...current].slice(0, 50));
    setActivePackId(nextPack.id);
    setSafeMessage("Пакет из 6 вариаций собран");
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", text: "Скопировано в буфер обмена" });
    } catch {
      setToast({ kind: "error", text: "Не удалось скопировать текст" });
    }
  };

  const handleExportJson = (pack: PromptPack) => {
    downloadFile(`${pack.id}.json`, JSON.stringify(pack, null, 2), "application/json;charset=utf-8");
    setSafeMessage(`Экспортирован ${pack.id}.json`);
  };

  const handleExportCsv = (pack: PromptPack) => {
    downloadFile(`${pack.id}.csv`, toCsv([pack]), "text/csv;charset=utf-8");
    setSafeMessage(`Экспортирован ${pack.id}.csv`);
  };

  const openPackInStudio = (pack: PromptPack) => {
    setStudioSetup(pack.setup_snapshot);
    setGeneratedPack(pack);
    setActiveTab("studio");
    setSafeMessage(`Пакет ${pack.id} открыт в Студии`);
  };

  const tabClass = (tab: TabKey): string =>
    `rounded-full px-5 py-2 text-[15px] font-medium transition ${
      activeTab === tab
        ? "bg-white text-[#0f0f12] shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
        : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]"
    }`;

  const galleryImageHeights = ["h-44", "h-72", "h-56", "h-80", "h-52", "h-64"] as const;

  const goHome = () => {
    setActivePreset(null);
    setActiveTab("gallery");
  };

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
                onClick={goHome}
              >
                Prompt Copilot
              </button>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <div className="flex items-center gap-3 text-zinc-400">
                <span className="text-base leading-none">✦</span>
                <input
                  className="w-full bg-transparent text-[15px] text-zinc-200 outline-none placeholder:text-zinc-500"
                  placeholder="Try ‘summer days in the mediterranean’"
                  value={galleryQuery}
                  onChange={(event) => setGalleryQuery(event.target.value)}
                />
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-end gap-2">
              <button data-testid="tab-gallery" className={tabClass("gallery")} onClick={() => setActiveTab("gallery")}>
                Галерея
              </button>
              <button data-testid="tab-studio" className={tabClass("studio")} onClick={() => setActiveTab("studio")}>
                Студия
              </button>
              <button data-testid="tab-packs" className={tabClass("packs")} onClick={() => setActiveTab("packs")}>
                Пакеты
              </button>
              <button className={tabClass("reference")} onClick={() => setActiveTab("reference")}>
                Справочник
              </button>
              <button className="ml-2 rounded-full bg-white px-6 py-2 text-[15px] font-semibold text-[#111214] shadow-[0_8px_30px_rgba(255,255,255,0.18)]">
                Create
              </button>
            </nav>
          </div>
        </header>

        {activeTab === "gallery" ? (
          <section className="mt-4 rounded-[30px] border border-white/10 bg-[#07080a]/95 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.4)] md:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Для вас</h2>
                <p className="mt-1 text-sm text-zinc-500">Подбери референс, открой готовый промпт и перенеси стиль в Студию.</p>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 md:block">
                {filteredPresets.length} пресетов
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {galleryCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  data-testid={category === "Все" ? "gallery-category-filter-all" : `gallery-category-filter-${category.toLowerCase()}`}
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
              {visiblePresets.map((preset, index) => (
                <button
                  type="button"
                  key={preset.id}
                  data-testid="gallery-card"
                  className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] text-left transition hover:translate-y-[-2px] hover:border-white/25"
                  onClick={() => {
                    setActivePreset(preset);
                  }}
                >
                  <img
                    src={preset.image_url}
                    alt={preset.title}
                    className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${galleryImageHeights[index % galleryImageHeights.length]}`}
                  />
                  <div className="p-3">
                    <p className="font-display text-base text-zinc-100">{preset.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{preset.description}</p>
                    <p className="mt-2 inline-flex rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                      {preset.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {visiblePresetCount < filteredPresets.length ? (
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
          <section className="mt-4 space-y-4 pb-28">
            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">Студия</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Выбери готовую задачу или камеру, примени сетап и собери Prompt Pack.
                  </p>
                </div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                  {[
                    { key: "tasks", label: "Задачи", testId: "studio-view-tasks" },
                    { key: "cameras", label: "Камеры", testId: "studio-view-cameras" },
                    { key: "reference", label: "Справка", testId: "studio-view-reference" },
                  ].map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      data-testid={view.testId}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        studioView === view.key
                          ? "bg-white text-zinc-950"
                          : "text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                      onClick={() => setStudioView(view.key as StudioViewKey)}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="min-w-[280px] flex-1 rounded-full border border-white/10 bg-[#101116] px-4 py-2">
                  <input
                    className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                    placeholder="Поиск по задачам, камерам, свету"
                    value={studioQuery}
                    onChange={(event) => setStudioQuery(event.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {STUDIO_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        studioCategory === category
                          ? "border-white/40 bg-white text-zinc-950"
                          : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.1]"
                      }`}
                      onClick={() => setStudioCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {studioView === "tasks" ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleStudioTasks.map((preset) => (
                    <article key={preset.id} data-testid="studio-task-card" className="rounded-2xl border border-white/10 bg-[#101116] p-4">
                      <p className="font-display text-lg text-zinc-100">{preset.task}</p>
                      <p className="mt-1 text-xs text-zinc-400">{preset.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-300">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{preset.camera}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{preset.lens_profile}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{preset.focal_mm} мм</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{preset.aperture}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">{preset.light}</span>
                      </div>
                      <button
                        type="button"
                        data-testid={`studio-task-apply-${preset.id}`}
                        className="mt-4 w-full rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/[0.16]"
                        onClick={() => applyTaskPreset(preset)}
                      >
                        Применить
                      </button>
                    </article>
                  ))}
                  {visibleStudioTasks.length === 0 ? (
                    <p className="text-sm text-zinc-400">По фильтрам ничего не найдено, попробуй сбросить поиск.</p>
                  ) : null}
                </div>
              ) : null}

              {studioView === "cameras" ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredStudioCameras.map((camera) => (
                    <article key={camera.name} data-testid="studio-camera-card" className="rounded-2xl border border-white/10 bg-[#101116] p-4">
                      <p className="font-display text-base text-zinc-100">{camera.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{camera.character}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-300">
                        <span className="text-zinc-200">Подходит для:</span> {camera.best_for.join(", ")}
                      </p>
                      <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300">
                        Лучшее сочетание: {camera.best_combo.lens_profile} • {camera.best_combo.focal_mm} мм •{" "}
                        {camera.best_combo.aperture} • {camera.best_combo.light}
                      </p>
                      <button
                        type="button"
                        data-testid={`studio-camera-apply-${toSlug(camera.name)}`}
                        className="mt-4 w-full rounded-full border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/[0.16]"
                        onClick={() => applyCameraCombo(camera)}
                      >
                        Применить best combo
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}

              {studioView === "reference" ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <article className="rounded-2xl border border-white/10 bg-[#101116] p-4">
                    <h3 className="font-display text-lg text-zinc-100">Фокусные расстояния</h3>
                    <div className="mt-3 space-y-2">
                      {STUDIO_FOCAL_LENGTH_GUIDE.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                          <p className="text-xs font-semibold text-zinc-200">{item.label}</p>
                          <p className="mt-1 text-[11px] text-zinc-400">{item.use.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-[#101116] p-4">
                    <h3 className="font-display text-lg text-zinc-100">Световые схемы</h3>
                    <div className="mt-3 space-y-2">
                      {STUDIO_LIGHT_SETUPS.map((item) => (
                        <div key={item.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                          <p className="text-xs font-semibold text-zinc-200">{item.name}</p>
                          <p className="mt-1 text-[11px] text-zinc-400">{item.best_for.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              ) : null}
            </div>

            <aside className="sticky bottom-4 z-20 rounded-2xl border border-white/15 bg-[#090a0d]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div data-testid="studio-current-setup" className="text-sm text-zinc-200">
                  <p className="font-display text-base">Текущий сетап</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {studioSetup.core6.camera_format} • {studioSetup.core6.lens_type} • {studioSetup.core6.focal_length_mm} мм •{" "}
                    {studioSetup.core6.aperture} • {studioSetup.core6.lighting_style}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="studio-open-prompt-drawer"
                    className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.14]"
                    onClick={() => setPromptDrawerOpen(true)}
                  >
                    Показать итоговый промпт
                  </button>
                  <button
                    data-testid="generate-pack-btn"
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                    onClick={handleGeneratePack}
                  >
                    Собрать Prompt Pack (6)
                  </button>
                </div>
              </div>
            </aside>

            {promptDrawerOpen ? (
              <section
                data-testid="studio-prompt-drawer"
                className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold tracking-tight">Итоговый промпт</h3>
                  <button
                    type="button"
                    data-testid="studio-close-prompt-drawer"
                    className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-zinc-200 transition hover:bg-white/[0.14]"
                    onClick={() => setPromptDrawerOpen(false)}
                  >
                    Закрыть
                  </button>
                </div>
                <pre className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-[#0d0e12] p-3 text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {variantPrompt(livePreview.variants[0]!)}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-zinc-200 transition hover:bg-white/[0.14]"
                    onClick={() => void handleCopyText(variantPrompt(livePreview.variants[0]!))}
                  >
                    Скопировать промпт
                  </button>
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold tracking-tight">Последний собранный пакет</h3>
                {generatedPack ? <p className="text-xs text-zinc-400">{formatDate(generatedPack.created_at)}</p> : null}
              </div>
              {generatedPack ? (
                <div className="mt-3 grid gap-3">
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
                          Копировать
                        </button>
                      </div>
                      <pre className="mt-2 max-h-36 overflow-auto rounded-xl border border-white/10 bg-[#0b0c10] p-2 text-[11px] whitespace-pre-wrap text-zinc-300">
                        {variantPrompt(variant)}
                      </pre>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">После нажатия «Собрать Prompt Pack (6)» здесь появятся 6 готовых вариантов.</p>
              )}
            </section>
          </section>
        ) : null}

        {activeTab === "packs" ? (
          <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">Пакеты</h2>
              <p className="mt-1 text-sm text-zinc-400">История собранных Prompt Pack, экспорт и быстрый возврат в Студию.</p>
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
                        <p className="font-mono text-xs text-zinc-300">{pack.id}</p>
                        <p className="text-sm text-zinc-100">{pack.setup_snapshot.preset_title || "Custom setup"}</p>
                        <p className="text-xs text-zinc-500">{formatDate(pack.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => setActivePackId(pack.id)}
                        >
                          Open
                        </button>
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => openPackInStudio(pack)}
                        >
                          Reopen in Studio
                        </button>
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => handleExportJson(pack)}
                        >
                          Export JSON
                        </button>
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => handleExportCsv(pack)}
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {packs.length === 0 ? <p className="text-sm text-zinc-400">Пока нет пакетов. Собери первый в Студии.</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold tracking-tight">Просмотр пакета</h3>
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
                <p className="mt-2 text-sm text-zinc-400">Выбери пакет слева, чтобы увидеть варианты.</p>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "reference" ? (
          <section className="mt-4 rounded-3xl border border-white/10 bg-[#07080a]/95 p-4 backdrop-blur-md md:p-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Справочник</h2>
            <p className="mt-1 text-sm text-zinc-400">Быстрые карточки по Core 6: что это, как влияет и когда использовать.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: "Camera Format",
                  what: "Тип сенсора и общий характер изображения.",
                  impact: "Влияет на зерно, контраст и кино-ощущение.",
                  when: "Digital Full Frame для чистоты, 16mm для фактуры.",
                  phrase: "camera format: classic 16mm film",
                },
                {
                  title: "Lens Type",
                  what: "Оптический характер объектива.",
                  impact: "Меняет пластику боке и геометрию кадра.",
                  when: "Anamorphic для более драматичного кино-языка.",
                  phrase: "lens type: anamorphic",
                },
                {
                  title: "Focal Length",
                  what: "Насколько широкий или плотный кадр.",
                  impact: "Меняет перспективу и чувство дистанции.",
                  when: "24mm для среды, 85mm для портрета/детали.",
                  phrase: "focal length: 50mm",
                },
                {
                  title: "Aperture",
                  what: "Глубина резкости и визуальный акцент.",
                  impact: "f/2.0 выделяет объект, f/4 стабилизирует сцену.",
                  when: "Открытая диафрагма для эмоции, закрытая для контроля.",
                  phrase: "aperture: f/2.8",
                },
                {
                  title: "Lighting Style",
                  what: "Режим света и контраста.",
                  impact: "Формирует настроение и читаемость фактур.",
                  when: "Soft key для lifestyle, directional key для drama.",
                  phrase: "lighting style: directional cinematic key",
                },
                {
                  title: "Camera Movement",
                  what: "Характер движения камеры.",
                  impact: "Влияет на темп и напряжение кадра.",
                  when: "Slow push-in для нарастания, static для чистоты.",
                  phrase: "camera movement: slow push-in",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0d0e12] p-4">
                  <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-2 text-xs text-zinc-400">Что это: {item.what}</p>
                  <p className="mt-1 text-xs text-zinc-400">Влияние: {item.impact}</p>
                  <p className="mt-1 text-xs text-zinc-400">Когда использовать: {item.when}</p>
                  <p className="mt-3 rounded-lg bg-white/10 px-2 py-1 font-mono text-[11px] text-zinc-200">{item.phrase}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {activePreset ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 px-4 py-6" data-testid="gallery-modal">
          <div className="max-h-full w-full max-w-5xl overflow-auto rounded-[30px] border border-white/15 bg-[#07080a] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.22em] text-zinc-500">Gallery Reference</p>
                <h3 className="font-display mt-1 text-3xl font-semibold tracking-tight">{activePreset.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{activePreset.description}</p>
              </div>
              <button
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200"
                onClick={() => setActivePreset(null)}
              >
                Закрыть
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <img
                src={activePreset.image_url}
                alt={activePreset.title}
                className="h-full min-h-72 w-full rounded-3xl border border-white/10 object-cover"
              />
              <div>
                <div className="inline-flex rounded-full border border-white/15 bg-[#101116] px-3 py-1 text-xs text-zinc-300">
                  Nano Banana Pro
                </div>

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
                    onClick={() => applyPresetToStudio(activePreset)}
                  >
                    Применить в Студию
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-30 rounded-xl border border-white/15 bg-[#111217]/95 px-4 py-2 text-sm text-zinc-100 shadow-[0_12px_30px_rgba(0,0,0,0.45)] animate-toast-fade">
          <span className={toast.kind === "error" ? "text-rose-300" : "text-emerald-300"}>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}
