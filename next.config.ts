import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep conventional (pre-Cache Components) behavior for this MVP.
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    // Logo uploads are sent as base64 through a Server Action.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
