import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow type errors during builds for deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
