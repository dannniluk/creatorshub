# Prompt Copilot MVP

Prompt Copilot is a desktop-first Next.js web app for stable prompt generation under a locked narrative core.

## Features (MVP)

- Locked Core Prompt editor (`character/style/composition/negative/text policy`)
- Scene Cards CRUD
- Technique Library CRUD
- Variation Engine with deterministic seeds and controlled axes (`camera/emotion/motion`)
- Run History with best-variant selection and 1-click reuse
- QC scoring (`character/composition/artifact/text safety`) with pass/fail threshold
- Prompt copy and JSON/CSV export

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

## API Surface

- `GET/PUT /api/locked-core`
- `GET/POST/PUT/DELETE /api/scenes`
- `GET/POST/PUT/DELETE /api/techniques`
- `POST /api/runs/generate`
- `GET /api/runs`
- `GET /api/runs/:id`
- `PATCH /api/variants/:id/qc`
- `PATCH /api/runs/:id/best`
- `GET /api/runs/:id/export?format=json|csv`

## Testing

```bash
pnpm test:unit
pnpm test:contract
pnpm test:e2e
```

Acceptance target:

1. Create one scene and one technique
2. Generate 12 variants
3. Apply QC and filter by threshold
4. Mark best variant
5. Export JSON/CSV package
6. Reopen historical run in one click

## Storage Notes

- Default store path: `data/store.json`
- Override for test or custom env with `PROMPT_COPILOT_STORE_PATH=/custom/path/store.json`

## Out of Scope (MVP)

- Provider-side generation execution (Kling/Nano Banana Pro)
- Billing, CRM, multi-user, production-grade persistence
