import type { Metadata } from 'next'
import { Outfit, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import Navbar from '@/components/layout/Navbar'
import RealtimeOrderProvider from '@/components/RealtimeOrderProvider'
import ClientLayout from './ClientLayout'
import { LocalBusinessJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

/**
 * SEO 增强的全局 Metadata 配置
 * 包含 OpenGraph、Twitter Card、关键词等
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://lwstringstudio.li-wei.net'),
  title: {
    default: 'LW String Studio — 羽毛球穿线',
    template: '%s — LW String Studio',
  },
  description: 'LW 穿线工作室，个人羽毛球穿线服务。在线预约、TNG支付、积分优惠。专业穿线，用心服务。',
  keywords: [
    '羽毛球穿线',
    'badminton stringing',
    'Malaysia',
    'LW String Studio',
    '穿线预约',
    'TNG支付',
    '穿线工作室',
  ],
  authors: [{ name: 'LW String Studio' }],
  creator: 'LW String Studio',
  publisher: 'LW String Studio',
  openGraph: {
    title: 'LW String Studio — 羽毛球穿线',
    description: '专业穿线，用心服务',
    type: 'website',
    locale: 'zh_MY',
    siteName: 'LW String Studio',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LW String Studio — 羽毛球穿线工作室',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LW String Studio',
    description: '专业穿线，用心服务',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // 当你注册 Google Search Console 后添加
    // google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 结构化数据 (JSON-LD) 用于 Google 富媒体搜索结果 */}
        <LocalBusinessJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={`${notoSans.variable} ${outfit.variable} font-sans`}>
        <SessionProvider>
          <RealtimeOrderProvider>
            <ClientLayout>
              <Navbar />
              <main className="min-h-screen bg-ink">
                {children}
              </main>
            </ClientLayout>
          </RealtimeOrderProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
