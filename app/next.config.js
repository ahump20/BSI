/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
