import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

const STORE_PATH = "/tmp/prompt-copilot-e2e-store.json";

function resetStore() {
  writeFileSync(
    STORE_PATH,
    JSON.stringify(
      {
        version: 1,
        locked_core: {
          character_lock: "",
          style_lock: "",
          composition_lock: "",
          negative_lock: "",
          text_policy: "NO-TEXT STRICT",
        },
        scenes: [],
        techniques: [],
        runs: [],
        variants: [],
      },
      null,
      2,
    ),
    "utf8",
  );
}

test.beforeEach(() => {
  resetStore();
});

test("acceptance: generate 12 variants, QC gate, export, and reopen run", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("locked-core-character").fill("Same actor in every frame");
  await page.getByTestId("locked-core-style").fill("Photoreal, high dynamic range, no stylization drift");
  await page.getByTestId("save-locked-core-btn").click();

  await page.getByTestId("scene-title-input").fill("Dock Arrival");
  await page.getByTestId("scene-goal-input").fill("Introduce protagonist");
  await page.getByPlaceholder("Action").fill("Walks toward camera through steam");
  await page.getByPlaceholder("Environment").fill("Industrial dock at sunrise");
  await page.getByPlaceholder("Lighting").fill("Soft rim light");
  await page.getByPlaceholder("Duration hint").fill("4s");
  await page.getByTestId("add-scene-btn").click();

  await page.getByTestId("technique-name-input").fill("Cinematic realism");
  await page.getByPlaceholder("Category").fill("camera");
  await page.getByPlaceholder("Cue").fill("micro parallax");
  await page.getByTestId("add-technique-btn").click();

  await page.getByTestId("variant-count-input").fill("12");
  await page.getByTestId("generate-variants-btn").click();

  await expect(page.getByTestId("variant-card")).toHaveCount(12);

  const firstCard = page.getByTestId("variant-card").first();
  await firstCard.getByRole("combobox").nth(0).selectOption("5");
  await firstCard.getByRole("combobox").nth(1).selectOption("5");
  await firstCard.getByRole("combobox").nth(2).selectOption("5");
  await firstCard.getByRole("combobox").nth(3).selectOption("5");
  await firstCard.getByRole("button", { name: "Score QC" }).click();
  await firstCard.getByRole("button", { name: "Mark best" }).click();

  await page.getByRole("checkbox", { name: "Show pass/best only" }).check();

  const historyItem = page.getByTestId("run-history-item").first();
  await expect(historyItem.getByRole("button", { name: "Export JSON" })).toBeVisible();
  await expect(historyItem.getByRole("button", { name: "Export CSV" })).toBeVisible();

  await historyItem.getByRole("button", { name: "Open run" }).click();
  await expect(page.getByText("Active run:")).toBeVisible();
});
