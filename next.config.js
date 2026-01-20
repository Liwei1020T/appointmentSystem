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
}

module.exports = nextConfig
