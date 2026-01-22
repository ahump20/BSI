/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  trailingSlash: false,
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
