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

  // Skip ESLint during build (handled by CI separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features
  experimental: {
    // Enable server actions for future use
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
