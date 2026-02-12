"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_GALLERY_PRESETS } from "@/lib/studio/presets";
import { generatePromptPack } from "@/lib/studio/generatePromptPack";
import type {
  Core6Setup,
  GalleryPreset,
  PromptPack,
  PromptPackVariant,
  PromptProvider,
  StudioSetup,
} from "@/lib/studio/types";

type TabKey = "gallery" | "studio" | "packs" | "reference";

const STORAGE_KEYS = {
  setup: "prompt-copilot/cinema/setup",
  packs: "prompt-copilot/cinema/packs",
  tab: "prompt-copilot/cinema/tab",
};

const CAMERA_FORMAT_OPTIONS = [
  "Digital Full Frame",
  "Classic 16mm Film",
  "Super 35",
  "Large Format",
] as const;

const LENS_OPTIONS = ["Spherical Prime", "Anamorphic", "Vintage Prime", "Zoom"] as const;

const APERTURE_OPTIONS = ["f/1.8", "f/2.0", "f/2.8", "f/4", "f/5.6"] as const;

const LIGHTING_OPTIONS = [
  "Soft warm key with gentle fill",
  "Directional cinematic key",
  "High contrast rim light",
  "Overcast natural softbox",
  "Practical motivated light",
] as const;

const MOVEMENT_OPTIONS = [
  "Static locked frame",
  "Slow push-in",
  "Smooth lateral tracking",
  "Subtle handheld drift",
  "Energetic forward tracking",
] as const;

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
  const headers = [
    "pack_id",
    "created_at",
    "preset_id",
    "preset_title",
    "variant_id",
    "variant_label",
    "prompt_kling",
    "prompt_nano",
  ];

  const rows = packs.flatMap((pack) =>
    pack.variants.map((variant) => [
      pack.id,
      pack.created_at,
      pack.setup_snapshot.preset_id ?? "",
      pack.setup_snapshot.preset_title,
      variant.id,
      variant.label,
      variant.prompt_kling,
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

function variantPrompt(variant: PromptPackVariant, provider: PromptProvider): string {
  return provider === "kling" ? variant.prompt_kling : variant.prompt_nano;
}

function StudioControlCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{title}</p>
      <p className="mt-2 text-lg font-medium text-zinc-100">{value}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
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
          camera_movement: MOVEMENT_OPTIONS[1],
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

  const [selectedProvider, setSelectedProvider] = useState<PromptProvider>("kling");
  const [modalProvider, setModalProvider] = useState<PromptProvider>("kling");
  const [activePackProvider, setActivePackProvider] = useState<PromptProvider>("kling");
  const [activePackId, setActivePackId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedPacks = safeParse<PromptPack[]>(localStorage.getItem(STORAGE_KEYS.packs)) ?? [];
    return storedPacks[0]?.id ?? null;
  });
  const [activePreset, setActivePreset] = useState<GalleryPreset | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.setup, JSON.stringify(studioSetup));
  }, [studioSetup]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(packs));
  }, [packs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tab, JSON.stringify(activeTab));
  }, [activeTab]);

  const filteredPresets = useMemo(() => {
    const query = galleryQuery.trim().toLowerCase();
    if (!query) {
      return DEFAULT_GALLERY_PRESETS;
    }

    return DEFAULT_GALLERY_PRESETS.filter((preset) => {
      const joined = [preset.title, preset.mood, preset.shot_type, preset.description, ...preset.tags].join(" ").toLowerCase();
      return joined.includes(query);
    });
  }, [galleryQuery]);

  const livePreview = useMemo(() => {
    return generatePromptPack({ setup: studioSetup, packId: "preview", createdAt: "2026-02-12T00:00:00.000Z" });
  }, [studioSetup]);

  const activePack = useMemo(() => {
    if (!activePackId) {
      return packs[0] ?? null;
    }
    return packs.find((item) => item.id === activePackId) ?? null;
  }, [activePackId, packs]);

  const setSafeMessage = (value: string) => {
    setMessage(value);
    setError("");
  };

  const setSafeError = (value: string) => {
    setError(value);
    setMessage("");
  };

  const applyPresetToStudio = (preset: GalleryPreset) => {
    setStudioSetup(createSetupFromPreset(preset));
    setActiveTab("studio");
    setActivePreset(null);
    setSafeMessage(`Пресет «${preset.title}» применен в Студию`);
  };

  const handleGeneratePack = () => {
    if (!studioSetup.scene_goal.trim() || !studioSetup.scene_action.trim() || !studioSetup.scene_environment.trim()) {
      setSafeError("Заполни Goal / Action / Environment перед сборкой пакета");
      return;
    }

    const nextPack = generatePromptPack({ setup: studioSetup });

    setGeneratedPack(nextPack);
    setPacks((current) => [nextPack, ...current].slice(0, 50));
    setActivePackId(nextPack.id);
    setSafeMessage("Prompt Pack из 6 вариантов собран");
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSafeMessage("Скопировано в буфер");
    } catch {
      setSafeError("Не удалось скопировать текст");
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

  const updateCore6 = <K extends keyof Core6Setup>(key: K, value: Core6Setup[K]) => {
    setStudioSetup((current) => ({
      ...current,
      core6: {
        ...current.core6,
        [key]: value,
      },
    }));
  };

  const tabClass = (tab: TabKey): string =>
    `rounded-full px-4 py-2 text-sm transition ${
      activeTab === tab ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300 hover:bg-white/20"
    }`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_22%,rgba(76,96,122,0.35),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(78,57,102,0.30),transparent_38%),#050507] text-zinc-100">
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-6 md:px-8">
        <header className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-zinc-400">Cinema Studio</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Prompt Copilot</h1>
            </div>
            <nav className="flex flex-wrap gap-2">
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
            </nav>
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </header>

        {activeTab === "gallery" ? (
          <section className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Галерея референсов</h2>
                <p className="mt-1 text-sm text-zinc-400">Кликаешь карточку, изучаешь готовый промпт и применяешь стиль в Студию.</p>
              </div>
              <input
                className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-zinc-100 outline-none md:w-80"
                placeholder="Поиск по mood, shot, тегам"
                value={galleryQuery}
                onChange={(event) => setGalleryQuery(event.target.value)}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  data-testid="gallery-card"
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition hover:-translate-y-0.5 hover:border-white/25"
                  onClick={() => {
                    setModalProvider("kling");
                    setActivePreset(preset);
                  }}
                >
                  <img src={preset.image_url} alt={preset.title} className="h-56 w-full object-cover" />
                  <div className="space-y-2 p-3">
                    <p className="text-sm font-semibold text-zinc-50">{preset.title}</p>
                    <p className="text-xs text-zinc-400">{preset.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "studio" ? (
          <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Студия</h2>
                <p className="mt-1 text-sm text-zinc-400">Собери сетап и получи 6 вариаций промпта под Kling и Nano Banana Pro.</p>
              </div>

              <div className="grid gap-3">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Scene Goal</span>
                  <input
                    data-testid="scene-goal-input"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    value={studioSetup.scene_goal}
                    onChange={(event) => setStudioSetup((current) => ({ ...current, scene_goal: event.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Scene Action</span>
                  <input
                    data-testid="scene-action-input"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    value={studioSetup.scene_action}
                    onChange={(event) => setStudioSetup((current) => ({ ...current, scene_action: event.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Scene Environment</span>
                  <input
                    data-testid="scene-environment-input"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    value={studioSetup.scene_environment}
                    onChange={(event) => setStudioSetup((current) => ({ ...current, scene_environment: event.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <StudioControlCard title="Camera" value={studioSetup.core6.camera_format}>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm"
                    value={studioSetup.core6.camera_format}
                    onChange={(event) => updateCore6("camera_format", event.target.value)}
                  >
                    {CAMERA_FORMAT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StudioControlCard>

                <StudioControlCard title="Lens" value={studioSetup.core6.lens_type}>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm"
                    value={studioSetup.core6.lens_type}
                    onChange={(event) => updateCore6("lens_type", event.target.value)}
                  >
                    {LENS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StudioControlCard>

                <StudioControlCard title="Focal Length" value={`${studioSetup.core6.focal_length_mm} mm`}>
                  <input
                    type="range"
                    min={14}
                    max={135}
                    step={1}
                    value={studioSetup.core6.focal_length_mm}
                    onChange={(event) => updateCore6("focal_length_mm", Number(event.target.value))}
                    className="w-full"
                  />
                </StudioControlCard>

                <StudioControlCard title="Aperture" value={studioSetup.core6.aperture}>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm"
                    value={studioSetup.core6.aperture}
                    onChange={(event) => updateCore6("aperture", event.target.value)}
                  >
                    {APERTURE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StudioControlCard>

                <StudioControlCard title="Lighting" value={studioSetup.core6.lighting_style}>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm"
                    value={studioSetup.core6.lighting_style}
                    onChange={(event) => updateCore6("lighting_style", event.target.value)}
                  >
                    {LIGHTING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StudioControlCard>

                <StudioControlCard title="Movement" value={studioSetup.core6.camera_movement}>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm"
                    value={studioSetup.core6.camera_movement}
                    onChange={(event) => updateCore6("camera_movement", event.target.value)}
                  >
                    {MOVEMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StudioControlCard>
              </div>

              <details className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-200">Locked Core (Advanced)</summary>
                <div className="mt-4 grid gap-3">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Character Lock</span>
                    <textarea
                      className="h-16 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      value={studioSetup.locked_core.character_lock}
                      onChange={(event) =>
                        setStudioSetup((current) => ({
                          ...current,
                          locked_core: { ...current.locked_core, character_lock: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Style Lock</span>
                    <textarea
                      className="h-16 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      value={studioSetup.locked_core.style_lock}
                      onChange={(event) =>
                        setStudioSetup((current) => ({
                          ...current,
                          locked_core: { ...current.locked_core, style_lock: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Composition Lock</span>
                    <textarea
                      className="h-16 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      value={studioSetup.locked_core.composition_lock}
                      onChange={(event) =>
                        setStudioSetup((current) => ({
                          ...current,
                          locked_core: { ...current.locked_core, composition_lock: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">Negative Lock</span>
                    <textarea
                      className="h-16 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      value={studioSetup.locked_core.negative_lock}
                      onChange={(event) =>
                        setStudioSetup((current) => ({
                          ...current,
                          locked_core: { ...current.locked_core, negative_lock: event.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </details>
            </div>

            <div className="space-y-4">
              <aside className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Live Prompt Preview</h3>
                  <div className="flex gap-2 rounded-full border border-white/15 bg-black/40 p-1">
                    <button
                      className={`rounded-full px-3 py-1 text-xs ${selectedProvider === "kling" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                      onClick={() => setSelectedProvider("kling")}
                    >
                      Kling
                    </button>
                    <button
                      className={`rounded-full px-3 py-1 text-xs ${selectedProvider === "nano" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                      onClick={() => setSelectedProvider("nano")}
                    >
                      Nano Banana Pro
                    </button>
                  </div>
                </div>

                <pre className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-3 text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {variantPrompt(livePreview.variants[0]!, selectedProvider)}
                </pre>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Будут собраны вариации</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {livePreview.variants.map((variant) => (
                      <span key={variant.id} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-zinc-200">
                        {variant.label}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  data-testid="generate-pack-btn"
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                  onClick={handleGeneratePack}
                >
                  Собрать Prompt Pack (6)
                </button>
              </aside>

              <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Последний собранный пакет</h3>
                  {generatedPack ? <p className="text-xs text-zinc-400">{formatDate(generatedPack.created_at)}</p> : null}
                </div>
                {generatedPack ? (
                  <div className="mt-3 grid gap-3">
                    {generatedPack.variants.map((variant) => (
                      <article key={variant.id} data-testid="pack-variant-card" className="rounded-2xl border border-white/10 bg-black/45 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{variant.label}</p>
                            <p className="text-xs text-zinc-400">{variant.summary}</p>
                          </div>
                          <button
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200 hover:bg-white/20"
                            onClick={() => void handleCopyText(variantPrompt(variant, selectedProvider))}
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="mt-2 max-h-36 overflow-auto rounded-xl border border-white/10 bg-black/55 p-2 text-[11px] whitespace-pre-wrap text-zinc-300">
                          {variantPrompt(variant, selectedProvider)}
                        </pre>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">После нажатия «Собрать Prompt Pack (6)» здесь появятся 6 готовых вариантов.</p>
                )}
              </section>
            </div>
          </section>
        ) : null}

        {activeTab === "packs" ? (
          <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
              <h2 className="text-2xl font-semibold">Пакеты</h2>
              <p className="mt-1 text-sm text-zinc-400">История собранных Prompt Pack, экспорт и быстрый возврат в Студию.</p>
              <div className="mt-4 space-y-3">
                {packs.map((pack) => (
                  <article
                    key={pack.id}
                    data-testid="pack-history-item"
                    className={`rounded-2xl border p-3 transition ${
                      activePackId === pack.id ? "border-white/35 bg-white/[0.08]" : "border-white/10 bg-black/40"
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

            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Просмотр пакета</h3>
                <div className="flex gap-2 rounded-full border border-white/15 bg-black/40 p-1">
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${activePackProvider === "kling" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                    onClick={() => setActivePackProvider("kling")}
                  >
                    Kling
                  </button>
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${activePackProvider === "nano" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                    onClick={() => setActivePackProvider("nano")}
                  >
                    Nano
                  </button>
                </div>
              </div>

              {activePack ? (
                <div className="mt-3 space-y-3">
                  {activePack.variants.map((variant) => (
                    <article key={variant.id} className="rounded-2xl border border-white/10 bg-black/45 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{variant.label}</p>
                        <button
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
                          onClick={() => void handleCopyText(variantPrompt(variant, activePackProvider))}
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/55 p-2 text-[11px] whitespace-pre-wrap text-zinc-300">
                        {variantPrompt(variant, activePackProvider)}
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
          <section className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-6">
            <h2 className="text-2xl font-semibold">Справочник</h2>
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
                <article key={item.title} className="rounded-2xl border border-white/10 bg-black/45 p-4">
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
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4 py-6" data-testid="gallery-modal">
          <div className="max-h-full w-full max-w-4xl overflow-auto rounded-3xl border border-white/15 bg-[#0b0d12] p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Gallery Reference</p>
                <h3 className="mt-1 text-2xl font-semibold">{activePreset.title}</h3>
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
              <img src={activePreset.image_url} alt={activePreset.title} className="h-full min-h-72 w-full rounded-2xl object-cover" />
              <div>
                <div className="flex gap-2 rounded-full border border-white/15 bg-black/40 p-1">
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${modalProvider === "kling" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                    onClick={() => setModalProvider("kling")}
                  >
                    Kling
                  </button>
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${modalProvider === "nano" ? "bg-white text-zinc-950" : "text-zinc-300"}`}
                    onClick={() => setModalProvider("nano")}
                  >
                    Nano Banana Pro
                  </button>
                </div>

                <pre className="mt-3 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/45 p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-200">
                  {activePreset.example_prompts[modalProvider]}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950"
                    onClick={() => void handleCopyText(activePreset.example_prompts[modalProvider])}
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
    </div>
  );
}
