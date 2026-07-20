import type { NextConfig } from "next";

const developmentActionOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "*.app.github.dev",
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
      ...(process.env.NODE_ENV === "development"
        ? { allowedOrigins: developmentActionOrigins }
        : {}),
    },
  },
};

export default nextConfig;
