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
  await expect(page.getByTestId("studio-view-tasks")).toBeVisible();
  await expect(page.getByTestId("studio-view-cameras")).toBeVisible();
  await expect(page.getByTestId("studio-task-card")).toHaveCount(9);
  await page.getByTestId("studio-task-apply-food-macro").click();
  await expect(page.getByTestId("studio-current-setup")).toContainText("Sony A1");
  await page.getByTestId("studio-open-prompt-drawer").click();
  await expect(page.getByTestId("studio-prompt-drawer")).toBeVisible();
  await expect(page.getByText("Nano Banana Pro Prompt")).toBeVisible();
  await page.getByTestId("studio-close-prompt-drawer").click();
  await page.getByTestId("studio-view-cameras").click();
  await expect(page.getByTestId("studio-camera-card")).toHaveCount(9);
  await page.getByTestId("studio-camera-apply-red-v-raptor-8k-vv").click();
  await expect(page.getByTestId("studio-current-setup")).toContainText("RED V-RAPTOR 8K VV");

  await page.getByTestId("tab-packs").click();
  await page.getByTestId("brand-home-btn").click();
  await expect(page.getByTestId("tab-gallery")).toBeVisible();

  await page.getByTestId("tab-studio").click();
  await page.getByTestId("generate-pack-btn").click();

  await expect(page.getByTestId("pack-variant-card")).toHaveCount(6);
  await expect(page.getByText("CAMERA MOVEMENT")).toHaveCount(0);

  await page.getByTestId("tab-packs").click();
  await expect(page.getByTestId("pack-history-item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" }).first()).toBeVisible();
});
