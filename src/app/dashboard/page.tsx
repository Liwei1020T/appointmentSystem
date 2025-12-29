/**
 * 用户仪表板路由
 * - 已登录用户：展示用户首页
 * - 管理员用户：重定向到管理后台
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import HomePage from '@/features/home/HomePage';

export const metadata = {
  title: '用户仪表板 - String Service',
  description: '用户登录后的仪表板首页',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (isAdminRole(session.user?.role)) {
    redirect('/admin/dashboard');
  }

  return <HomePage />;
}
