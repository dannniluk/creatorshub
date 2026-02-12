# Prompt Copilot MVP

Prompt Copilot is a desktop-first `Cinema Studio` for creators and producers. The app helps users pick a visual setup, adapt it in a simple studio panel, and export provider-specific prompt packs.

## Features (Current MVP)

- Tabbed UX: `Галерея`, `Студия`, `Пакеты`, `Справочник`
- Gallery with visual references and modal prompt examples
- `Kling` and `Nano Banana Pro` prompt preview tabs
- Studio controls (`Camera`, `Lens`, `Focal`, `Aperture`, `Lighting`, `Movement`)
- `Locked Core (Advanced)` block for consistency controls
- Prompt Pack generator with 6 controlled variants
- Pack history with reopen, copy, JSON export, CSV export

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind
- Lightweight API routes (`src/app/api/*`)
- JSON storage for MVP (`data/store.json`)
- Vitest (unit + contract), Playwright (UI smoke/acceptance)

## Getting Started

Prerequisites:

- Node.js 20+
- `pnpm` via Corepack

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm dev
```

App URL: [http://localhost:3000](http://localhost:3000)

## GitHub Pages

Configured via workflow: `/Users/chinaski89/Desktop/creator's hub/.github/workflows/deploy-pages.yml`.

Deployment URL:

- [https://dannniluk.github.io/creatorshub/](https://dannniluk.github.io/creatorshub/)

Notes for Pages mode:

- The app runs in local mode (`localStorage` persistence) because GitHub Pages is static hosting.
- API route handlers are temporarily excluded during `build:pages` by `/Users/chinaski89/Desktop/creator's hub/scripts/build-pages.mjs`.

## Testing

```bash
pnpm test:unit
pnpm test:contract
pnpm test:e2e
```

Acceptance target:

1. Open gallery and apply a preset into studio
2. Build a prompt pack (6 variants)
3. Switch between Kling/Nano prompt previews
4. Open Packs tab and export JSON/CSV
5. Reopen saved pack into Studio

## Storage Notes

- Default store path: `data/store.json`
- Override for test or custom env with `PROMPT_COPILOT_STORE_PATH=/custom/path/store.json`

## Out of Scope (MVP)

- Provider-side generation execution API
- Billing, CRM, multi-user, production-grade persistence
