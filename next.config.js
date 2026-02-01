/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Docker 部署必需
  reactStrictMode: true,
  eslint: {
    // Allow production builds even if ESLint reports warnings/errors.
    ignoreDuringBuilds: true,
  },
  images: {
    // 使用 remotePatterns 替代 domains (Next.js 14 推荐)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lwstringstudio.li-wei.net',
        pathname: '/uploads/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // 安全响应头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 防止点击劫持
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // 防止 MIME 类型嗅探
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS 保护 (旧版浏览器)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 控制 Referrer 信息
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 权限策略 - 禁用不需要的功能
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // 强制 HTTPS (仅生产环境)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]
            : []),
        ],
      },
    ];
  },
}

module.exports = nextConfig
