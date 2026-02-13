# Pro Mode Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить отдельный Pro режим в Studio как пошаговый wizard (6 шагов) со скрытым prompt по умолчанию и production-safe дефолтами.

**Architecture:** Вынести Pro-справочники и prompt-builder в `src/lib/studio/proMode.ts`, а UI-wizard встроить в `PromptCopilotApp` как отдельную ветку внутри вкладки `Студия` с переключателем режимов. Состояние Pro хранить в `ProWizard` + `localStorage`, prompt показывать только в drawer/sheet с focus trap.

**Tech Stack:** Next.js App Router, React hooks, Tailwind CSS, Vitest + Testing Library.

---

### Task 1: Pro model + prompt builder (TDD)

**Files:**
- Create: `tests/unit/studio/proMode.test.ts`
- Create: `src/lib/studio/proMode.ts`

**Step 1: Write failing tests**
- Проверить дефолтное состояние `ProWizard` (step=1, locks ON, safe negative list).
- Проверить структуру compact/full prompt и обязательные блоки `TEXT POLICY: NO-TEXT STRICT`.
- Проверить map slider→aperture и объяснения для focal chips.

**Step 2: Run failing tests**
- `pnpm test:unit`

**Step 3: Implement minimal code**
- Добавить типы, constants для шагов, генерацию compact/full prompt, helper-функции.

**Step 4: Run tests**
- `pnpm test:unit`

### Task 2: Pro wizard UI in Studio

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`
- Modify: `src/lib/studio/catalog.ts`

**Step 1: Wire mode toggle**
- Переключатель `Минималистичный режим / Pro режим` в блоке Studio.

**Step 2: Build 6-step sliding wizard**
- Шаги Camera/Lens/Focal/Aperture/Lighting/Final.
- Auto-advance на выбор.
- Back + progress clickable navigation.
- Keyboard arrows support.

**Step 3: Add sticky setup panel**
- Desktop right panel / mobile bottom bar.
- Кнопки `Показать промпт`, `Скопировать`, `Добавить в пакет`.

**Step 4: Add prompt drawer/sheet**
- Compact/Full toggle.
- Copy compact/full.
- `4 варианта`.
- `Advanced toggles` (locks + negative constraints editable).

### Task 3: Integrate with beginner flow and packs

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`

**Step 1: Update “Open Pro” actions**
- Из деталей/пост-копи переводить в новый Pro mode.

**Step 2: Keep existing pack export unchanged**
- Добавление из Pro в текущий Prompt Pack через `generatePromptPack`.

### Task 4: Verification

**Files:**
- N/A

**Step 1: Unit tests**
- `pnpm test:unit`

**Step 2: Contract tests**
- `pnpm test:contract`

**Step 3: Build**
- `pnpm build`
