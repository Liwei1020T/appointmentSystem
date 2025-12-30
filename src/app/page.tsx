/**
 * 首页路由 (Home Route Page) - SSR 优化版
 * 
 * Next.js App Router 页面文件 (Server Component)
 * - 未登录用户：显示 Landing Page（服务介绍）
 * - 已登录用户：显示 HomePage（用户首页）
 * 
 * 优化说明：
 * - 使用 Server Component 避免客户端水合延迟
 * - 使用 auth() 在服务端获取 session
 * - 消除首屏加载时的闪烁问题
 */

import { auth } from '@/lib/auth';
import HomePage from '@/features/home/HomePage';
import LandingPage from '@/features/landing/LandingPage';

/**
 * 首页 - Server Component
 * 在服务端判断用户登录状态，直接渲染对应页面
 */
export default async function Page() {
  // 服务端获取 session（无需客户端加载）
  const session = await auth();

  // 根据登录状态渲染不同页面
  // HomePage 和 LandingPage 仍为 Client Component，支持交互
  return session?.user ? <HomePage /> : <LandingPage />;
}
