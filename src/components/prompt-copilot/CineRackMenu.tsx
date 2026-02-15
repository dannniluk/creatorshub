import type { JSX } from "react";

import type { CineRackCameraFilter } from "@/lib/studio/cineRack";
import type { ProCameraOption } from "@/lib/studio/proMode";

type RackStep = 1 | 2 | 3 | 4;

type CineRackMenuProps = {
  filter: CineRackCameraFilter;
  onFilterChange: (next: CineRackCameraFilter) => void;
  cameras: readonly ProCameraOption[];
  selectedCamera: string;
  selectedLens: string;
  selectedFocal: number;
  selectedAperture: string;
  recommendedCameraLabels: readonly string[];
  savedCameraLabels: readonly string[];
  onToggleSelectedCameraSave: () => void;
  onCameraSelect: (camera: string) => void;
  onJumpToStep: (step: RackStep) => void;
};

const FILTERS: Array<{ key: CineRackCameraFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "recommended", label: "Recommended" },
  { key: "saved", label: "Saved" },
];

const CAMERA_TONE_BY_CATEGORY: Record<string, string> = {
  People: "from-[#59627a]/80 to-[#2a2f3d]/75",
  Product: "from-[#65706f]/80 to-[#2b3433]/75",
  Fashion: "from-[#6b6258]/80 to-[#312c27]/75",
  Interiors: "from-[#62686f]/80 to-[#2c3037]/75",
};

const SUMMARY_IMAGES = {
  lens: "/camera-icons/rack-lens.jpg",
  focal: "/camera-icons/rack-focal.jpg",
  aperture: "/camera-icons/rack-aperture.jpg",
} as const;

function getCameraImage(label: string): string {
  const normalized = label.toLowerCase();

  if (normalized.includes("arri") || normalized.includes("blackmagic") || normalized.includes("cinema")) {
    return "/camera-icons/rack-camera-cinema.jpg";
  }

  if (normalized.includes("red") || normalized.includes("v-raptor") || normalized.includes("12k")) {
    return "/camera-icons/rack-camera-pro.jpg";
  }

  if (normalized.includes("hasselblad") || normalized.includes("gfx") || normalized.includes("fujifilm")) {
    return "/camera-icons/rack-camera-pro.jpg";
  }

  if (normalized.includes("sony") || normalized.includes("nikon") || normalized.includes("canon") || normalized.includes("iphone")) {
    return "/camera-icons/rack-camera-mirrorless.jpg";
  }

  return "/camera-icons/rack-camera-digital.jpg";
}

function MetricPreview(props: { src: string; alt: string }): JSX.Element {
  return (
    <span className="relative block h-16 w-32 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <img src={props.src} alt={props.alt} className="h-full w-full object-cover" loading="lazy" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
    </span>
  );
}

function BookmarkIcon({ active }: { active: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 4.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 17 4.5v16l-5-3-5 3z"
        fill={active ? "#f4f5f7" : "none"}
        stroke={active ? "#f4f5f7" : "#9ca3af"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CineRackMenu(props: CineRackMenuProps): JSX.Element {
  const recommendedSet = new Set(props.recommendedCameraLabels);
  const savedSet = new Set(props.savedCameraLabels);
  const lensShort = props.selectedLens.split("•")[0]?.trim() || props.selectedLens;

  return (
    <section
      className="mt-3 rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(118deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08))] p-3 md:p-4"
      data-testid="pro-cine-rack"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-2" data-testid="cine-rack-filters">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${
                props.filter === item.key
                  ? "bg-white text-zinc-950"
                  : "border border-white/15 bg-white/[0.05] text-zinc-200 hover:bg-white/[0.12]"
              }`}
              onClick={() => props.onFilterChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          data-testid="cine-rack-save-setup"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/[0.14]"
          onClick={props.onToggleSelectedCameraSave}
        >
          <BookmarkIcon active={savedSet.has(props.selectedCamera)} />
          Save setup
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          data-testid="cine-rack-jump-camera"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(1)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Camera</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <MetricPreview src={getCameraImage(props.selectedCamera)} alt={`Camera ${props.selectedCamera}`} />
            <p className="max-w-[50%] text-right text-sm font-semibold text-zinc-100">{props.selectedCamera}</p>
          </div>
        </button>

        <button
          type="button"
          data-testid="cine-rack-jump-lens"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(2)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Lens</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <MetricPreview src={SUMMARY_IMAGES.lens} alt="Lens" />
            <p className="max-w-[50%] text-right text-sm font-semibold text-zinc-100">{lensShort}</p>
          </div>
        </button>

        <button
          type="button"
          data-testid="cine-rack-jump-focal"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(3)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Focal Length</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <MetricPreview src={SUMMARY_IMAGES.focal} alt="Focal Length" />
            <p className="text-2xl font-semibold text-zinc-100">{props.selectedFocal} mm</p>
          </div>
        </button>

        <button
          type="button"
          data-testid="cine-rack-jump-aperture"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(4)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Aperture</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <MetricPreview src={SUMMARY_IMAGES.aperture} alt="Aperture" />
            <p className="text-2xl font-semibold text-zinc-100">{props.selectedAperture}</p>
          </div>
        </button>
      </div>

      <div data-testid="pro-step-camera-grid" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {props.cameras.map((camera) => {
          const isSelected = props.selectedCamera === camera.label;
          const isRecommended = recommendedSet.has(camera.label);
          const isSaved = savedSet.has(camera.label);
          const tone = CAMERA_TONE_BY_CATEGORY[camera.category] ?? "from-[#626a7a]/80 to-[#313847]/75";

          return (
            <button
              key={camera.label}
              type="button"
              className={`relative flex min-h-[132px] flex-col rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? "border-white/45 bg-white/[0.18]"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
              }`}
              onClick={() => props.onCameraSelect(camera.label)}
            >
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={getCameraImage(camera.label)} alt={`Camera ${camera.label}`} className="h-24 w-full object-cover" loading="lazy" />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone}`} />
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-100">{camera.label}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{camera.bestFor}</p>

              <div className="mt-auto flex flex-wrap gap-1 pt-3">
                {camera.chips.map((chip) => (
                  <span key={`${camera.label}-${chip}`} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-200">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                <span>{isRecommended ? "Recommended" : "Camera"}</span>
                <span>{isSaved ? "Saved" : "Live"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {props.cameras.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300">
          Для текущего фильтра пока нет камер. Переключитесь на All или сохраните текущую камеру.
        </p>
      ) : null}
    </section>
  );
}
