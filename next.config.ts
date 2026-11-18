import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep conventional (pre-Cache Components) behavior for this MVP.
  cacheComponents: false,
  partialPrefetching: false,
};

export default nextConfig;
