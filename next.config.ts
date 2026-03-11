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

  // Turbopack needs explicit root when building from staging dir (iCloud workaround)
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
      { source: '/api/hero-scores', destination: `${devProxyApiBase}/api/hero-scores` },
      { source: '/api/status', destination: `${devProxyApiBase}/api/status` },
      { source: '/api/model-health', destination: `${devProxyApiBase}/api/model-health` },
      { source: '/api/news', destination: `${devProxyApiBase}/api/news` },
      { source: '/api/intel/:path*', destination: `${devProxyApiBase}/api/intel/:path*` },
      { source: '/api/college-baseball/:path*', destination: `${devProxyApiBase}/api/college-baseball/:path*` },
      { source: '/api/college-football/:path*', destination: `${devProxyApiBase}/api/college-football/:path*` },
      { source: '/api/mlb/:path*', destination: `${devProxyApiBase}/api/mlb/:path*` },
      { source: '/api/nfl/:path*', destination: `${devProxyApiBase}/api/nfl/:path*` },
      { source: '/api/nba/:path*', destination: `${devProxyApiBase}/api/nba/:path*` },
      { source: '/api/cfb/:path*', destination: `${devProxyApiBase}/api/cfb/:path*` },
      { source: '/api/cbb/:path*', destination: `${devProxyApiBase}/api/cbb/:path*` },
      { source: '/api/cv/:path*', destination: `${devProxyApiBase}/api/cv/:path*` },
      { source: '/api/multiplayer/:path*', destination: `${devProxyApiBase}/api/multiplayer/:path*` },
      { source: '/api/scores/:path*', destination: `${devProxyApiBase}/api/scores/:path*` },
      { source: '/api/savant/:path*', destination: `${devProxyApiBase}/api/savant/:path*` },
      { source: '/api/search', destination: `${devProxyApiBase}/api/search` },
      { source: '/api/health/:path*', destination: `${devProxyApiBase}/api/health/:path*` },
      { source: '/api/models/:path*', destination: `${devProxyApiBase}/api/models/:path*` },
      { source: '/api/analytics/:path*', destination: `${devProxyApiBase}/api/analytics/:path*` },
      { source: '/api/nil/:path*', destination: `${devProxyApiBase}/api/nil/:path*` },
      { source: '/api/portal/:path*', destination: `${devProxyApiBase}/api/portal/:path*` },
      { source: '/api/blog-post-feed/:path*', destination: `${devProxyApiBase}/api/blog-post-feed/:path*` },
    ];
  },

};

export default nextConfig;
