import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo sits under a home directory that has its own package-lock.json;
  // pin the workspace root so Turbopack does not go looking upwards.
  turbopack: { root: process.cwd() },
  devIndicators: false,
};

export default nextConfig;
