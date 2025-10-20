import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const legacyRedirects = [
  { source: '/mlb', destination: '/', permanent: true },
  { source: '/mlb/index.html', destination: '/', permanent: true },
  { source: '/nfl', destination: '/', permanent: true },
  { source: '/nfl/index.html', destination: '/', permanent: true },
  { source: '/cfb', destination: '/', permanent: true },
  { source: '/cfb/index.html', destination: '/', permanent: true },
  { source: '/cbb', destination: '/', permanent: true },
  { source: '/cbb/index.html', destination: '/', permanent: true },
  { source: '/analytics.html', destination: '/baseball/ncaab', permanent: true },
  { source: '/copilot.html', destination: '/', permanent: true },
  { source: '/api/mlb/:path*', destination: '/api/v1/baseball/ncaab/:path*', permanent: true },
  { source: '/api/ncaa/:path*', destination: '/api/v1/baseball/ncaab/:path*', permanent: true }
];

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: { unoptimized: false },
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  async redirects() {
    return legacyRedirects;
  }
};
export default withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true, disableLogger: true });
