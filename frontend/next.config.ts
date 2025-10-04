import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 빌드를 위한 standalone 출력 설정
  output: 'standalone',
};

export default nextConfig;
