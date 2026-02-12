import { expect, test } from "@playwright/test";

test("cinema studio flow: gallery -> studio -> packs", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");

  await expect(page.getByTestId("tab-gallery")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Для вас" })).toBeVisible();
  await expect(page.getByTestId("gallery-sort-select")).toHaveCount(0);
  await expect(page.getByTestId("gallery-category-filter-all")).toBeVisible();
  await expect(page.getByText("Connect styles")).toHaveCount(0);
  await expect(page.getByText("⌘K")).toHaveCount(0);
  await expect(page.getByTestId("gallery-card")).toHaveCount(8);
  await page.getByRole("button", { name: "Еще" }).click();
  await expect(page.getByTestId("gallery-card")).toHaveCount(16);

  await page.getByTestId("gallery-card").first().click();

  await expect(page.getByTestId("gallery-modal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kling" })).toHaveCount(0);
  await page.getByRole("button", { name: "Скопировать промпт" }).click();
  await expect(page.getByText("Скопировано в буфер обмена")).toBeVisible();
  await page.getByRole("button", { name: "Применить в Студию" }).click();

  await page.getByTestId("tab-studio").click();
  await expect(page.getByRole("heading", { name: "Студия" })).toBeVisible();
  await expect(page.getByText("Цель сцены")).toBeVisible();
  await expect(page.getByRole("button", { name: /^35 мм$/ })).toBeVisible();
  await expect(page.getByText("Движение камеры")).toHaveCount(0);
  await expect(page.getByText("Справочник камер")).toBeVisible();
  await expect(page.getByText("RED V-RAPTOR 8K VV").first()).toBeVisible();
  await page.getByTestId("studio-recipe-food-macro").click();
  await expect(page.getByTestId("scene-goal-input")).toHaveValue(/макро/i);

  await page.getByTestId("tab-packs").click();
  await page.getByTestId("brand-home-btn").click();
  await expect(page.getByTestId("tab-gallery")).toBeVisible();

  await page.getByTestId("tab-studio").click();
  await page.getByTestId("scene-goal-input").fill("Показать уверенного героя в кадре");
  await page.getByTestId("scene-action-input").fill("Герой идет к камере сквозь дым");
  await page.getByTestId("scene-environment-input").fill("Индустриальный док на рассвете");

  await page.getByTestId("generate-pack-btn").click();

  await expect(page.getByTestId("pack-variant-card")).toHaveCount(6);
  await expect(page.getByText("CAMERA MOVEMENT")).toHaveCount(0);

  await page.getByTestId("tab-packs").click();
  await expect(page.getByTestId("pack-history-item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" }).first()).toBeVisible();
});
