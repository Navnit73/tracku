import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  serverExternalPackages: ["mongoose", "bcryptjs"],
};

export default nextConfig;
