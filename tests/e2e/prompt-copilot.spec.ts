import { expect, test } from "@playwright/test";

test("studio beginner flow: card grid -> copy -> compact sheet -> pro", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");

  await page.getByTestId("tab-studio").click();
  await expect(page.getByRole("heading", { name: "Студия для новичков" })).toBeVisible();

  await expect(page.getByTestId("studio-task-card").first()).toBeVisible();
  await expect(page.getByTestId("result-panel")).toHaveCount(0);
  await expect(page.getByTestId("copy-prompt-fashion_texture_01")).toBeVisible();
  await expect(page.getByTestId("details-fashion_texture_01")).toBeVisible();

  await page.getByTestId("copy-prompt-fashion_texture_01").click();
  await expect(page.locator("span.text-emerald-300").filter({ hasText: "Скопировано ✅" })).toBeVisible();
  await expect(page.getByTestId("post-copy-sheet")).toBeVisible();

  await page.getByTestId("sheet-show-prompt").click();
  await expect(page.getByTestId("sheet-mode-compact")).toBeVisible();
  await expect(page.getByTestId("sheet-prompt-preview")).toBeVisible();
  await expect(page.getByText("CAMERA:")).toBeVisible();
  await expect(page.getByText("NO TEXT:")).toBeVisible();

  await page.getByTestId("sheet-mode-full").click();
  await expect(page.getByTestId("sheet-mode-full")).toHaveAttribute("data-active", "true");
  await expect(page.getByText("NEGATIVE CONSTRAINTS:")).toBeVisible();

  await page.getByTestId("sheet-copy-compact").click();
  await expect(page.locator("span.text-emerald-300").filter({ hasText: "Скопировано ✅" })).toBeVisible();

  await page.getByTestId("sheet-variations").click();
  await expect(page.getByTestId("pack-variant-card")).toHaveCount(4);

  await page.getByTestId("sheet-open-pro").click();
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

test("gallery modal closes by backdrop click", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("gallery-card").first().click();
  await expect(page.getByTestId("gallery-modal")).toBeVisible();

  await page.getByTestId("gallery-modal").click({ position: { x: 8, y: 8 } });
  await expect(page.getByTestId("gallery-modal")).toHaveCount(0);
});
