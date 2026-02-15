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
  People: "from-[#59627a] to-[#2a2f3d]",
  Product: "from-[#65706f] to-[#2b3433]",
  Fashion: "from-[#6b6258] to-[#312c27]",
  Interiors: "from-[#62686f] to-[#2c3037]",
};

function CameraIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 96 66" className="h-12 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden="true">
      <rect x="9" y="19" width="78" height="36" rx="10" fill="#2b2f37" />
      <rect x="12" y="22" width="72" height="29" rx="8" fill="#3d434f" opacity="0.55" />
      <rect x="22" y="13" width="20" height="9" rx="3" fill="#4f5766" />
      <rect x="24" y="15" width="9" height="5" rx="2" fill="#677184" opacity="0.75" />
      <circle cx="56" cy="37" r="15" fill="#1a1e25" />
      <circle cx="56" cy="37" r="12" fill="#646f83" opacity="0.9" />
      <circle cx="56" cy="37" r="8.5" fill="#202730" />
      <circle cx="56" cy="37" r="4.5" fill="#0f1319" />
      <circle cx="59" cy="34" r="2.2" fill="#c6d3e9" opacity="0.85" />
      <rect x="72" y="27" width="8" height="4" rx="2" fill="#848ea2" opacity="0.65" />
    </svg>
  );
}

function LensIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 96 66" className="h-12 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden="true">
      <ellipse cx="25" cy="33" rx="11" ry="15" fill="#5a6373" />
      <rect x="24" y="18" width="40" height="30" rx="7" fill="#323844" />
      <rect x="34" y="18" width="8" height="30" fill="#5f6a7d" opacity="0.45" />
      <rect x="50" y="18" width="7" height="30" fill="#697589" opacity="0.35" />
      <ellipse cx="64" cy="33" rx="16" ry="17" fill="#6c778c" />
      <ellipse cx="64" cy="33" rx="12" ry="13" fill="#242a33" />
      <ellipse cx="64" cy="33" rx="6" ry="7" fill="#0e1319" />
      <ellipse cx="68" cy="29" rx="2" ry="2" fill="#d6e2f8" opacity="0.8" />
    </svg>
  );
}

function FocusIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 96 66" className="h-12 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden="true">
      <circle cx="48" cy="33" r="21" fill="#2d323c" />
      <circle cx="48" cy="33" r="17" fill="#5d6678" opacity="0.72" />
      <circle cx="48" cy="33" r="12" fill="#1a2028" />
      <circle cx="48" cy="33" r="7" fill="#0e1218" />
      <path d="M48 12V18" stroke="#9da8bf" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M48 48V54" stroke="#9da8bf" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M27 33H21" stroke="#9da8bf" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M75 33H69" stroke="#9da8bf" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

function ApertureIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 96 66" className="h-12 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]" aria-hidden="true">
      <circle cx="48" cy="33" r="20" fill="#646d7f" />
      <circle cx="48" cy="33" r="16" fill="#2b313b" />
      <path d="M48 19L57 25L52 33L40 33L39 24Z" fill="#7c8598" opacity="0.8" />
      <path d="M39 24L40 33L32 42L27 33L31 24Z" fill="#646d7f" opacity="0.85" />
      <path d="M32 42L40 33L52 33L55 43L46 48Z" fill="#8892a6" opacity="0.75" />
      <path d="M55 43L52 33L57 25L68 28L65 39Z" fill="#737c90" opacity="0.8" />
      <circle cx="48" cy="33" r="6" fill="#0f1319" />
    </svg>
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
        <nav className="flex flex-wrap items-center gap-2">
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
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(1)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Camera</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <CameraIcon />
            <p className="max-w-[62%] text-right text-sm font-semibold text-zinc-100">{props.selectedCamera}</p>
          </div>
        </button>

        <button
          type="button"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(2)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Lens</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <LensIcon />
            <p className="max-w-[62%] text-right text-sm font-semibold text-zinc-100">{lensShort}</p>
          </div>
        </button>

        <button
          type="button"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(3)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Focal Length</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <FocusIcon />
            <p className="text-2xl font-semibold text-zinc-100">{props.selectedFocal} mm</p>
          </div>
        </button>

        <button
          type="button"
          className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.12]"
          onClick={() => props.onJumpToStep(4)}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Aperture</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <ApertureIcon />
            <p className="text-2xl font-semibold text-zinc-100">{props.selectedAperture}</p>
          </div>
        </button>
      </div>

      <div data-testid="pro-step-camera-grid" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {props.cameras.map((camera) => {
          const isSelected = props.selectedCamera === camera.label;
          const isRecommended = recommendedSet.has(camera.label);
          const isSaved = savedSet.has(camera.label);
          const tone = CAMERA_TONE_BY_CATEGORY[camera.category] ?? "from-[#626a7a] to-[#313847]";

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
              <div className={`rounded-xl bg-gradient-to-br ${tone} p-2`}>
                <CameraIcon />
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
