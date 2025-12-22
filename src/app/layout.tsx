import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import Navbar from '@/components/layout/Navbar'
import RealtimeOrderProvider from '@/components/RealtimeOrderProvider'
import ClientLayout from './ClientLayout'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'String Service Platform - 羽毛球穿线服务',
  description: '专业的羽毛球穿线管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={poppins.className}>
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
