# Cinema Studio UX Redesign v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a beginner-first Studio flow where users can produce a production-safe prompt in 20–30 seconds.

**Architecture:** Keep one-page App Router UI, but reframe Studio into task-card entry + sticky result panel + optional advanced drawer. Move preset data to a human+tech schema and map 3 sliders to technical settings through deterministic rules.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, Vitest, Playwright, Zod.

---

### Task 1: Redesign studio preset domain and mapping rules

**Files:**
- Modify: `/Users/chinaski89/Desktop/creator's hub/src/lib/studio/catalog.ts`
- Create: `/Users/chinaski89/Desktop/creator's hub/src/lib/studio/sliderMapping.ts`
- Create: `/Users/chinaski89/Desktop/creator's hub/src/lib/studio/presetSchema.ts`
- Test: `/Users/chinaski89/Desktop/creator's hub/tests/unit/studio/sliderMapping.test.ts`
- Test: `/Users/chinaski89/Desktop/creator's hub/tests/contract/studioPresetSchema.contract.test.ts`

**Step 1:** Write failing unit/contract tests for slider mapping and preset schema requirements.

**Step 2:** Run focused tests to confirm RED.

**Step 3:** Implement new types/data/mapping and schema.

**Step 4:** Re-run focused tests to confirm GREEN.

**Step 5:** Commit domain changes.

### Task 2: Update prompt generation contract for production-safe output

**Files:**
- Modify: `/Users/chinaski89/Desktop/creator's hub/src/lib/studio/generatePromptPack.ts`
- Modify: `/Users/chinaski89/Desktop/creator's hub/src/lib/studio/types.ts`
- Test: `/Users/chinaski89/Desktop/creator's hub/tests/unit/studio/promptPack.test.ts`

**Step 1:** Write failing tests for required sections, negative constraints, NO-TEXT strict, and 4-variant generation.

**Step 2:** Run focused tests to confirm RED.

**Step 3:** Implement minimal generator updates and setup metadata.

**Step 4:** Re-run tests to confirm GREEN.

**Step 5:** Commit prompt engine changes.

### Task 3: Implement Studio UX flow (cards → sticky result panel → advanced)

**Files:**
- Modify: `/Users/chinaski89/Desktop/creator's hub/src/components/prompt-copilot/PromptCopilotApp.tsx`
- Modify: `/Users/chinaski89/Desktop/creator's hub/src/app/globals.css` (only if needed)
- Test: `/Users/chinaski89/Desktop/creator's hub/tests/e2e/prompt-copilot.spec.ts`

**Step 1:** Write failing e2e expectations for:
- human task cards with hidden tech chips by default
- sticky result panel with bullets, sliders and RU copy
- prompt preview collapse, copy, 4 variations, advanced toggle
- packs copy-all and RU-only labels

**Step 2:** Run e2e test to confirm RED.

**Step 3:** Implement UI and state transitions.

**Step 4:** Re-run e2e tests for GREEN.

**Step 5:** Commit UX implementation.

### Task 4: End-to-end verification and docs alignment

**Files:**
- Modify: `/Users/chinaski89/Desktop/creator's hub/README.md` (if text mismatch)

**Step 1:** Run full verification:
- `pnpm test:unit`
- `pnpm test:contract`
- `pnpm build`
- `pnpm test:e2e`

**Step 2:** Fix regressions until all pass.

**Step 3:** Prepare summary with what changed and what remains optional (P2 tooltips depth).

