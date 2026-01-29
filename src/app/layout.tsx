import type { Metadata } from 'next'
import { Space_Grotesk, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import Navbar from '@/components/layout/Navbar'
import RealtimeOrderProvider from '@/components/RealtimeOrderProvider'
import ClientLayout from './ClientLayout'
import { LocalBusinessJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/ThemeProvider'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const spaceGrotesk = Space_Grotesk({
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 结构化数据 (JSON-LD) 用于 Google 富媒体搜索结果 */}
        <LocalBusinessJsonLd />
        <WebSiteJsonLd />
        {/* 防止主题切换时的闪烁 - 静态脚本，无用户输入 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme-preference');var r=t;if(!t||t==='system'){r=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.classList.add(r)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${notoSans.variable} ${spaceGrotesk.variable} font-sans`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white dark:focus:bg-dark-elevated focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-md"
        >
          跳转到主要内容
        </a>
        <SessionProvider>
          <ThemeProvider>
            <RealtimeOrderProvider>
              <ClientLayout>
                <Navbar />
                <main id="main-content" className="min-h-screen bg-ink dark:bg-dark">
                  {children}
                </main>
              </ClientLayout>
            </RealtimeOrderProvider>
          </ThemeProvider>
          <ServiceWorkerRegistration />
        </SessionProvider>
      </body>
    </html>
  )
}
