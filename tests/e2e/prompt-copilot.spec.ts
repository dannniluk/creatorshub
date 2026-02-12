import { expect, test } from "@playwright/test";

test("beginner flow builds production-safe prompt quickly", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");

  await page.getByTestId("tab-studio").click();

  await expect(page.getByTestId("beginner-mode-default")).toBeVisible();
  await expect(page.getByTestId("studio-category-food")).toBeVisible();

  await page.getByTestId("studio-category-food").click();
  await page.getByTestId("studio-goal-texture").click();

  await page.getByTestId("slider-detail").fill("82");
  await page.getByTestId("slider-background-blur").fill("58");
  await page.getByTestId("slider-light-drama").fill("64");

  await expect(page.getByTestId("preset-card").first()).toBeVisible();
  await expect(page.getByText("Recommended").first()).toBeVisible();

  await page.getByTestId("preset-apply-food-safe-overhead").click();

  await expect(page.getByTestId("prompt-preview")).toContainText("INTENT:");
  await expect(page.getByTestId("prompt-preview")).toContainText("NO-TEXT STRICT");

  await page.getByTestId("copy-prompt-btn").click();
  await expect(page.getByText("Скопировано в буфер обмена")).toBeVisible();

  await page.getByTestId("generate-4-variations-btn").click();
  await expect(page.getByTestId("pack-variant-card")).toHaveCount(4);

  await page.getByTestId("toggle-advanced").click();
  await expect(page.getByTestId("advanced-panel")).toBeVisible();
  await expect(page.getByText("How close you feel + how much the background compresses.")).toBeVisible();
  await expect(page.getByText("How much is in focus.")).toBeVisible();
  await expect(page.getByText("Side light to reveal texture.").first()).toBeVisible();

  await page.getByTestId("pro-camera-select").selectOption("Canon EOS R5");
  await expect(page.getByTestId("current-setup-line")).toContainText("Canon EOS R5");
});
