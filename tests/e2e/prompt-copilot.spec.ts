import { expect, test } from "@playwright/test";

test("cinema studio flow: gallery -> studio -> packs", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");

  await expect(page.getByTestId("tab-gallery")).toBeVisible();
  await page.getByTestId("gallery-card").first().click();

  await expect(page.getByTestId("gallery-modal")).toBeVisible();
  await page.getByRole("button", { name: "Применить в Студию" }).click();

  await page.getByTestId("tab-studio").click();
  await page.getByTestId("scene-goal-input").fill("Показать уверенного героя в кадре");
  await page.getByTestId("scene-action-input").fill("Герой идет к камере сквозь дым");
  await page.getByTestId("scene-environment-input").fill("Индустриальный док на рассвете");

  await page.getByTestId("generate-pack-btn").click();

  await expect(page.getByTestId("pack-variant-card")).toHaveCount(6);

  await page.getByTestId("tab-packs").click();
  await expect(page.getByTestId("pack-history-item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" }).first()).toBeVisible();
});
