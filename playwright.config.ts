import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4317",
    headless: true,
    channel: "chrome",
  },
  webServer: {
    command: "pnpm dev --port 4317 --hostname 127.0.0.1",
    url: "http://127.0.0.1:4317",
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PROMPT_COPILOT_STORE_PATH: "/tmp/prompt-copilot-e2e-store.json",
    },
  },
});
