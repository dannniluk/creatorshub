# Cinema Studio MVP Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current Prompt Copilot UI with a creator-friendly Cinema Studio flow: Gallery -> Studio -> Packs -> Reference, with provider-specific prompt previews for Kling and Nano Banana Pro.

**Architecture:** Keep existing Next.js app and backend routes intact for compatibility, but move the primary UX to a new client-side state model tuned for static hosting. Add a dedicated studio domain module (`presets`, `prompt pack generator`, `history persistence`) and render a tabbed UI with modal-based gallery interactions and split studio editing.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind, Vitest, Playwright.

---

### Task 1: Studio Domain Model + Generator (TDD)

**Files:**
- Create: `tests/unit/studio/promptPack.test.ts`
- Create: `src/lib/studio/types.ts`
- Create: `src/lib/studio/presets.ts`
- Create: `src/lib/studio/generatePromptPack.ts`

**Step 1: Write failing tests**
- Add tests for:
  - `generatePromptPack` returns exactly 6 variants
  - provider prompts are generated for both `kling` and `nano`
  - locked core text appears in every variant
  - variant IDs remain deterministic for same setup

**Step 2: Run tests to verify RED**
- Run: `pnpm test:unit -- tests/unit/studio/promptPack.test.ts`
- Expected: FAIL with missing module/functions.

**Step 3: Minimal implementation**
- Add studio types and 12 placeholder gallery presets.
- Implement deterministic pack generation with 6 variant profiles.
- Implement provider-specific prompt formatting functions.

**Step 4: Run tests to verify GREEN**
- Run: `pnpm test:unit -- tests/unit/studio/promptPack.test.ts`
- Expected: PASS.

**Step 5: Commit**
- `feat: add cinema studio prompt pack domain`

### Task 2: New Cinema Studio UI Shell

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`
- Optionally create: `src/components/prompt-copilot/cinema/*`

**Step 1: Write failing e2e expectations**
- Update e2e for new tabs and core flow:
  - open `Галерея`
  - open reference modal
  - apply preset to `Студия`
  - generate prompt pack
  - open `Пакеты`

**Step 2: Run e2e to verify RED**
- Run: `pnpm test:e2e -- tests/e2e/prompt-copilot.spec.ts`
- Expected: FAIL with missing selectors/features.

**Step 3: Implement UI**
- Add tab nav (`Галерея`, `Студия`, `Пакеты`, `Справочник`).
- Build gallery cards with modal (`Kling`/`Nano` tabs, copy/apply buttons).
- Build studio split layout with Core 6 controls.
- Add `Locked Core (Advanced)` accordion.
- Add prompt preview tabs + `Собрать Prompt Pack (6)` action.

**Step 4: Verify GREEN**
- Re-run updated e2e and fix failing selectors.

**Step 5: Commit**
- `feat: implement cinema studio tabbed interface`

### Task 3: Packs, Export, and Persistence

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`
- Modify/Create: `src/lib/studio/storage.ts` (if extracted)

**Step 1: Write failing tests**
- Add/extend unit tests for:
  - history persistence to localStorage
  - export JSON/CSV content shape

**Step 2: Verify RED**
- Run: targeted unit tests and confirm failures.

**Step 3: Implement**
- Save packs and current setup in localStorage.
- Build Packs tab with copy/export/reopen actions.
- Ensure CSV uses expected header contract.

**Step 4: Verify GREEN**
- Run: unit tests + e2e.

**Step 5: Commit**
- `feat: add pack history and export actions`

### Task 4: Polish, Docs, and Verification

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/prompt-copilot.spec.ts`

**Step 1: Implement polish**
- Improve RU labels, helper texts, empty states.
- Confirm mobile workable layout.

**Step 2: Final verification**
- Run:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm build`
  - `pnpm build:pages`

**Step 3: Commit**
- `feat: polish cinema studio mvp experience`

