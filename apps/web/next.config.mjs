import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(configDir, '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: { unoptimized: false },
  output: 'standalone',
  outputFileTracingRoot: workspaceRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
