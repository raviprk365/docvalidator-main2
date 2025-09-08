import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  basePath: '',
};

export default nextConfig;
