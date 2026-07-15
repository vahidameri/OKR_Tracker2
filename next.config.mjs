/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['web-push'],
  },
};

export default nextConfig;
