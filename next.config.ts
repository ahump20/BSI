import type { NextConfig } from 'next';

/**
 * Next.js Configuration for Blaze Sports Intel
 *
 * Configured for static export to Cloudflare Pages.
 * Dynamic routes require generateStaticParams() for static export.
 */
const nextConfig: NextConfig = {
  output: 'export',

  // Static export settings
  images: {
    unoptimized: true,
  },

  // Use trailing slashes - Cloudflare Pages reliably serves index.html from directories
  trailingSlash: true,

  // Skip TypeScript errors during build (handled by CI separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Publishable keys are safe to embed — they're not credentials
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      'pk_live_51RlBWILvpRBk20R2K8sqQVkChQNmI2uIplQkQlwzre0a89T0BitfA56d4igyBYLCdbHJ32FNpYuaGBXixWo9nY6t00AROOs9vh',
  },

};

export default nextConfig;
