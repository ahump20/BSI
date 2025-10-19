import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: https: blob:",
  "media-src 'self' https: blob:",
  "connect-src 'self' https://api.blazesportsintel.com https://analytics.blazesportsintel.com wss://live.blazesportsintel.com",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: { unoptimized: false },
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  }
};

export default withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true, disableLogger: true });
