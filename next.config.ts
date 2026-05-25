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
};

export default nextConfig;
