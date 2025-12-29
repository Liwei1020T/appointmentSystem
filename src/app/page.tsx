/**
 * 首页路由 (Home Route Page)
 * 
 * Next.js App Router 页面文件
 * - 未登录用户：显示 Landing Page（服务介绍）
 * - 已登录用户：显示 HomePage（用户首页）
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HomePage from '@/features/home/HomePage';
import LandingPage from '@/features/landing/LandingPage';
import PageLoading from '@/components/loading/PageLoading';

export default function Page() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const loading = status === 'loading';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 避免 SSR 不匹配
  if (!mounted || loading) {
    return <PageLoading surface="dark" />;
  }

  // 根据登录状态渲染不同页面
  return isAuthenticated ? <HomePage /> : <LandingPage />;
}
