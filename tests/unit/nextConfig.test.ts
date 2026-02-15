import { afterEach, describe, expect, test, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

async function importConfigWithEnv(env: NodeJS.ProcessEnv) {
  process.env = { ...ORIGINAL_ENV, ...env };
  vi.resetModules();
  const mod = await import("../../next.config");
  return mod.default;
}

describe("next.config pages basePath", () => {
  test("uses repository from GITHUB_REPOSITORY", async () => {
    const config = await importConfigWithEnv({
      GITHUB_PAGES: "true",
      GITHUB_REPOSITORY: "dannniluk/creatorshub",
      GITHUB_PAGES_REPO: "",
    });

    expect(config.basePath).toBe("/creatorshub");
    expect(config.assetPrefix).toBe("/creatorshub/");
  });

  test("falls back to GITHUB_PAGES_REPO when GITHUB_REPOSITORY is missing", async () => {
    const config = await importConfigWithEnv({
      GITHUB_PAGES: "true",
      GITHUB_REPOSITORY: "",
      GITHUB_PAGES_REPO: "creatorshub",
    });

    expect(config.basePath).toBe("/creatorshub");
    expect(config.assetPrefix).toBe("/creatorshub/");
  });

  test("does not set basePath outside pages build", async () => {
    const config = await importConfigWithEnv({
      GITHUB_PAGES: "",
      GITHUB_REPOSITORY: "dannniluk/creatorshub",
      GITHUB_PAGES_REPO: "creatorshub",
    });

    expect(config.basePath).toBe("");
    expect(config.assetPrefix).toBeUndefined();
  });
});
