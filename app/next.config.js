/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    scrollRestoration: true,
  },
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_WORKER_BASE_URL;
    if (!base) {
      return [];
    }
    return [
      {
        source: '/dev/ue/:path*',
        destination: `${base.replace(/\/$/, '')}/dev/ue/:path*`,
      },
      {
        source: '/api/flags',
        destination: `${base.replace(/\/$/, '')}/api/flags`,
      },
    ];
  },
};

module.exports = nextConfig;
