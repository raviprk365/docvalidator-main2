/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  basePath: '',
};

module.exports = nextConfig;