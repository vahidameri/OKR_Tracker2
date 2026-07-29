/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // حذف هدر X-Powered-By برای کاهش سطح افشای اطلاعات
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['web-push'],
  },
  // هدرهای امنیتی روی همه‌ی مسیرها (برای استقرار روی سرور داخلی)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
