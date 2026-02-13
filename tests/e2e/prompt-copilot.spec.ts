import { expect, test } from "@playwright/test";

test("studio beginner flow: task card -> result panel -> advanced", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");

  await page.getByTestId("tab-studio").click();
  await expect(page.getByRole("heading", { name: "Студия" })).toBeVisible();

  await expect(page.getByTestId("studio-task-card").first()).toBeVisible();
  await expect(page.getByTestId("task-tech-chips-fashion_texture_01")).toBeHidden();

  await page.getByTestId("studio-task-open-fashion_texture_01").click();
  await expect(page.getByText("Применено: Текстуры одежды")).toBeVisible();
  await expect(page.getByTestId("result-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Что получится" })).toBeVisible();

  await page.getByTestId("task-show-params-fashion_texture_01").click();
  await expect(page.getByTestId("task-tech-chips-fashion_texture_01")).toBeVisible();

  const resultPanel = page.getByTestId("result-panel");
  await expect(resultPanel.getByText("Мягче")).toBeVisible();
  await expect(resultPanel.getByText("Супер-детали")).toBeVisible();
  await expect(resultPanel.getByText("Фон читается")).toBeVisible();
  await expect(resultPanel.getByText("Сильное размытие")).toBeVisible();
  await expect(resultPanel.getByText("Мягко")).toBeVisible();
  await expect(resultPanel.getByText("Драма")).toBeVisible();

  await page.getByTestId("copy-prompt-btn").click();
  await expect(page.getByText("Скопировано в буфер обмена")).toBeVisible();

  await page.getByTestId("generate-4-variations-btn").click();
  await expect(page.getByTestId("pack-variant-card")).toHaveCount(4);

  await page.getByTestId("open-advanced-btn").click();
  await expect(page.getByTestId("advanced-panel")).toBeVisible();
  await page.getByTestId("advanced-mode-simple").click();
  await expect(page.getByTestId("pro-camera-select")).toHaveCount(0);

  await page.getByTestId("advanced-mode-pro").click();
  await expect(page.getByTestId("pro-camera-select")).toBeVisible();
  await page.getByTestId("advanced-panel").getByRole("button", { name: "Закрыть" }).click();

  await page.getByTestId("tab-packs").click();
  await expect(page.getByRole("heading", { name: "Наборы промптов" })).toBeVisible();
  await expect(page.getByTestId("copy-all-pack-btn")).toBeVisible();

  await expect(page.getByText("Create")).toHaveCount(0);
  await expect(page.getByText("For You")).toHaveCount(0);
  await expect(page.getByText("Show advanced")).toHaveCount(0);
});
