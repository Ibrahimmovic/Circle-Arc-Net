import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@circle-fin/app-kit",
    "@circle-fin/adapter-viem-v2",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.NEXT_PUBLIC_BUILD_SHA ??
      "local",
  },
};

export default nextConfig;
