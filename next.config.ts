import type { NextConfig } from "next";

const isPagesBuild = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? process.env.GITHUB_PAGES_REPO ?? "";
const basePath = isPagesBuild && repoName ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: isPagesBuild ? "export" : undefined,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: isPagesBuild,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
