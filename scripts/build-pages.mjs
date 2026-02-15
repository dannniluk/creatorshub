import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { execSync, spawn } from "node:child_process";

const root = process.cwd();
const apiPath = join(root, "src", "app", "api");
const stashPath = join(root, "src", ".pages-api-backup");

if (existsSync(stashPath)) {
  throw new Error(`Backup path already exists: ${stashPath}`);
}

const moved = existsSync(apiPath);
if (moved) {
  renameSync(apiPath, stashPath);
}

function resolvePagesRepoName() {
  const envRepoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? process.env.GITHUB_PAGES_REPO ?? "";
  if (envRepoName) {
    return envRepoName;
  }

  try {
    const originUrl = execSync("git config --get remote.origin.url", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    const match = originUrl.match(/github\.com[:/][^/]+\/([^/.]+)(?:\.git)?$/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

const pagesRepoName = resolvePagesRepoName();

const child = spawn(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "next", "build"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_FORCE_LOCAL_MODE: "true",
      GITHUB_PAGES_REPO: pagesRepoName,
    },
  },
);

function restoreApiRoutes() {
  if (existsSync(stashPath) && !existsSync(apiPath)) {
    renameSync(stashPath, apiPath);
  }
}

child.on("error", (error) => {
  restoreApiRoutes();
  throw error;
});

child.on("exit", (code) => {
  restoreApiRoutes();
  process.exit(code ?? 1);
});
