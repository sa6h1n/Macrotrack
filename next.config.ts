import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep route links permissive so the app can add routes without requiring
  // generated .next route types during a standalone typecheck.
  typedRoutes: false
};

export default nextConfig;
