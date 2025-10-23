/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: { unoptimized: false },
  output: 'standalone'
};

export default nextConfig;
