import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import Navbar from '@/components/layout/Navbar'
import RealtimeOrderProvider from '@/components/RealtimeOrderProvider'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <SessionProvider>
          <RealtimeOrderProvider>
            <ClientLayout>
              <Navbar />
              <main className="min-h-screen bg-gray-50">
                {children}
              </main>
            </ClientLayout>
          </RealtimeOrderProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
