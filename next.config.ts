import type { NextConfig } from "next";
const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/FusaakiGamesLLC" : "";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1"],
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
};
export default nextConfig;
