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
  await expect(page.getByText("CAMERA FORMAT:")).toBeVisible();

  await page.getByTestId("sheet-mode-full").click();
  await expect(page.getByTestId("sheet-mode-full")).toHaveAttribute("data-active", "true");
  await expect(page.getByText("NEGATIVE LOCK:")).toBeVisible();
  await expect(page.getByText("TEXT POLICY:")).toBeVisible();

  await page.getByTestId("sheet-copy-compact").click();
  await expect(page.locator("span.text-emerald-300").filter({ hasText: "Скопировано ✅" })).toBeVisible();

  await page.getByTestId("sheet-variations").click();
  await expect(page.getByTestId("pack-variant-card")).toHaveCount(4);

  await page.getByTestId("sheet-open-pro").click();
  await expect(page.getByRole("heading", { name: "Pro режим" })).toBeVisible();
  await expect(page.getByTestId("pro-wizard")).toBeVisible();
  await expect(page.getByTestId("pro-step-camera-grid").locator("button")).toHaveCount(16);
  await expect(page.getByTestId("pro-current-setup")).toBeVisible();
  await page.getByTestId("pro-step-camera-grid").getByRole("button", { name: /Digital Full Frame/ }).click();
  await expect(page.getByText("Шаг 2 / 6")).toBeVisible();
  await expect(page.locator('[data-testid^="pro-lens-type-"]')).toHaveCount(8);
  await expect(page.getByTestId("pro-step-lens-grid").getByText("Spherical Prime")).toBeVisible();
  await page.getByRole("button", { name: "Минималистичный режим" }).click();
  await expect(page.getByTestId("pro-wizard")).toHaveCount(0);

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

test("pro aperture slider does not auto-advance and uses explicit next/back controls", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");
  await page.getByTestId("tab-studio").click();
  await page.getByRole("button", { name: "Pro режим" }).click();

  await page.getByTestId("pro-step-camera-grid").getByRole("button", { name: /Digital Full Frame/ }).click();
  await page.getByTestId("pro-step-lens-grid").getByRole("button", { name: /Spherical Prime/ }).click();
  await expect(page.getByTestId("pro-lens-series-modal")).toBeVisible();
  await page.getByTestId("pro-lens-skip-type").click();
  await page.getByTestId("pro-step-focal-grid").getByRole("button", { name: /50 мм/ }).click();

  await expect(page.getByText("Шаг 4 / 6")).toBeVisible();
  const slider = page.getByTestId("pro-aperture-slider");

  await slider.evaluate((input) => {
    const element = input as HTMLInputElement;
    element.value = "75";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.getByText("Шаг 4 / 6")).toBeVisible();

  await page.getByRole("button", { name: "f/5.6" }).click();
  await expect(page.getByText("Шаг 4 / 6")).toBeVisible();

  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Шаг 4 / 6")).toBeVisible();

  await page.getByTestId("pro-aperture-back").click();
  await expect(page.getByText("Шаг 3 / 6")).toBeVisible();
  await page.getByTestId("pro-step-focal-grid").getByRole("button", { name: /50 мм/ }).click();
  await expect(page.getByText("Шаг 4 / 6")).toBeVisible();

  await page.getByTestId("pro-aperture-next").click();
  await expect(page.getByText("Шаг 5 / 6")).toBeVisible();
});

test("pro lens type supports optional series and filters focal options", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/");
  await page.getByTestId("tab-studio").click();
  await page.getByRole("button", { name: "Pro режим" }).click();

  await page.getByTestId("pro-step-camera-grid").getByRole("button", { name: /Digital Full Frame/ }).click();
  await page.getByTestId("pro-step-lens-grid").getByRole("button", { name: /Telephoto Prime/ }).click();
  await expect(page.getByTestId("pro-lens-series-modal")).toBeVisible();

  await page.getByTestId("pro-lens-series-tele_leica_summicron_c").click();
  await page.getByTestId("pro-lens-confirm-series").click();

  await expect(page.getByText("Шаг 3 / 6")).toBeVisible();
  await expect(page.getByTestId("pro-step-focal-grid").getByText("24 мм")).toHaveCount(0);
  await expect(page.getByTestId("pro-step-focal-grid").getByText("105 мм")).toBeVisible();
  await expect(page.getByText(/Telephoto Prime: рекомендовано 105 мм/)).toBeVisible();
});
