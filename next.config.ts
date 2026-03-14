import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';
const devProxyApiBase = (process.env.BSI_DEV_PROXY_API_BASE || 'https://blazesportsintel.com').replace(/\/+$/, '');

/**
 * Next.js Configuration for Blaze Sports Intel
 *
 * Configured for static export to Cloudflare Pages.
 * Dynamic routes require generateStaticParams() for static export.
 */
const nextConfig: NextConfig = {
  output: 'export',

  // Turbopack needs explicit root for consistent module resolution
  turbopack: {
    root: process.cwd(),
  },

  // Static export settings
  images: {
    unoptimized: true,
  },

  // Use trailing slashes - Cloudflare Pages reliably serves index.html from directories
  trailingSlash: true,
  skipTrailingSlashRedirect: isDevelopment,

  // Skip TypeScript errors during build (handled by CI separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Publishable keys are safe to embed — they're not credentials
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      'pk_live_51RlBWILvpRBk20R2K8sqQVkChQNmI2uIplQkXlwzre0a89T0BitfA56d4igyBYLCdbHJ32FNpYuaGBXixWo9nY6t00AROOs9vh',
    NEXT_PUBLIC_POSTHOG_KEY: 'phc_KirkHATYxmVzlCgyZzXRwpdTvrKBVA4vyZ7b44NTtE5',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
  },

  async rewrites() {
    if (!isDevelopment) return [];

    return [
      { source: '/api/:path*', destination: `${devProxyApiBase}/api/:path*` },
    ];
  },

};

export default nextConfig;
