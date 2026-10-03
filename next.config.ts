import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'nodemailer'],
  outputFileTracingIncludes: {
    '/**': ['./prisma/**/*'],
  },
};

export default nextConfig;
