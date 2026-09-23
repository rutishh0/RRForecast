import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `BUILD_STANDALONE=1 npm run build` emits .next/standalone — a self-contained
  // server that runs with plain `node server.js`, no npm install and no network.
  // Used to run the app on a locked-down machine. Unset for normal deploys.
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  // The repo sits under a home directory that has its own package-lock.json;
  // pin the workspace root so Turbopack does not go looking upwards.
  turbopack: { root: process.cwd() },
  devIndicators: false,
};

export default nextConfig;
