import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // specify the root directory for Turbopack
  },
  reactStrictMode: true,
};

export default nextConfig;
