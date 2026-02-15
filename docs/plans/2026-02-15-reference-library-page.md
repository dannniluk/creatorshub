# Справочник техник Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить полноценную вкладку «Справочник» с фильтрами, поиском, карточкой техники и реальным применением изменений в «Студии» через partial preset и rule-pack.

**Architecture:** Данные техник выносятся в типизированный каталог `src/lib/studio/referenceTechniques.ts`. В `PromptCopilotApp` добавляется отдельное состояние фильтров/поиска/модалки и обработчики применения. Для rule-pack вводится состояние активных правил и функция применения правил к `StudioSetup`, чтобы изменения реально попадали в итоговый промпт/пакеты.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind, Playwright.

---

### Task 1: Модель данных справочника

**Files:**
- Create: `src/lib/studio/referenceTechniques.ts`
- Modify: `src/lib/studio/catalog.ts`

**Step 1: Описать типы техник и apply-модели**
- Добавить поля: `difficulty`, `mood`, `genre`, `section`, `what`, `whenUse`, `whenAvoid`, `settingChanges`, `apply`.
- `apply.kind` поддерживает `partial-preset` и `rule-pack`.

**Step 2: Создать стартовый каталог техник**
- Добавить 8-12 техник с человеческими RU-текстами.
- Убедиться, что терминология без «ГРИП/DOF/setup».

**Step 3: Добавить мапы лейблов фильтров**
- Сложность: `Просто / Средне / Pro`.
- Подготовить значения для селекторов и chips.

### Task 2: Новый UX вкладки «Справочник»

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`

**Step 1: Добавить состояние вкладки**
- Поиск, фильтры (`сложность/настроение/жанр/раздел`), выбранная техника.

**Step 2: Собрать плитки и фильтры**
- Фильтрация по всем 4 параметрам + строка поиска по названию/описанию.
- Сетка карточек в стилистике текущего приложения.

**Step 3: Добавить модалку/drawer техники**
- Блоки: «Что это», «Когда использовать», «Когда не стоит», «Что изменится в настройках».
- Кнопка «Добавить в настройки».

### Task 3: Реальное применение в «Студии»

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`

**Step 1: Реализовать `partial-preset`**
- Обновлять `selectedPresetId`, `sceneDraft`, `techOverrides` частично.
- Переключать пользователя на вкладку `Студия` и показывать toast.

**Step 2: Реализовать `rule-pack`**
- Добавить состояние активных rules.
- На этапе построения `studioSetup`/`proSetup` вносить правила в `scene_*` и/или `locked_core`.

**Step 3: Добавить визуальную обратную связь в Студии**
- Показ активных правил и кнопка очистки (если применимо).

### Task 4: Терминология и тексты

**Files:**
- Modify: `src/components/prompt-copilot/PromptCopilotApp.tsx`
- Modify: `src/lib/studio/lensCatalog.ts`

**Step 1: Убрать «setup/сетап» в UI-строках**
- Заменить на «настройки».

**Step 2: Уточнить «Фокус и размытость»**
- Где уместно, заменить технические формулировки.

**Step 3: Проверить отсутствие «ГРИП/DOF» в пользовательских текстах**
- Привести формулировки к «глубина резкости».

### Task 5: Проверка

**Files:**
- Modify: `tests/e2e/prompt-copilot.spec.ts`

**Step 1: Добавить e2e сценарий для «Справочника»**
- Фильтры + поиск + открытие карточки + «Добавить в настройки».

**Step 2: Запустить проверки**
- `pnpm test:unit`
- `pnpm test:contract`
- `pnpm test:e2e`

**Step 3: Зафиксировать ограничения**
- Если какой-то набор тестов не запустился, указать это явно в отчете.
