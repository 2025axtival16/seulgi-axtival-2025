import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Strict Mode 비활성화
  async rewrites() {
    return [
      {
        source: "/api/:path*", // 프론트에서 부를 때는 /api/...
        destination: "http://localhost:8000/api/:path*", // 실제 FastAPI
      },
    ];
  },
};

export default withVanillaExtract(nextConfig);
