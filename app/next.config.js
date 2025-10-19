/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async rewrites() {
    const proxyBase = process.env.NEXT_PUBLIC_PROXY_BASE ?? process.env.NEXT_PUBLIC_WORKER_BASE_URL;
    if (!proxyBase) {
      return [];
    }

    return [
      {
        source: '/dev/proxy/:path*',
        destination: `${proxyBase.replace(/\/$/, '')}/proxy/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
