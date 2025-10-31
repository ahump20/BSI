/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Skip type checking during build (handled separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable experimental features for better performance
  experimental: {
    // optimizeCss disabled due to missing critters module
    // optimizeCss: true,
  },

  // Webpack configuration for Babylon.js
  webpack: (config, { isServer }) => {
    // Don't bundle Babylon.js on the server
    if (isServer) {
      config.externals = [...(config.externals || []), '@babylonjs/core', '@babylonjs/loaders'];
    }

    // Add fallback for Node.js modules that might be referenced
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },

  // Image optimization
  images: {
    domains: ['assets.babylonjs.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for WebGPU and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Transpile Babylon.js packages
  transpilePackages: ['@babylonjs/core', '@babylonjs/loaders'],
};

module.exports = nextConfig;
