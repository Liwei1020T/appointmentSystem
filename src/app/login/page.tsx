/**
 * 登录页面路由 (Login Route Page)
 * 
 * Next.js App Router 页面文件
 */

import LoginPage from '@/features/auth/LoginPage';

export const metadata = {
  title: '登录 | String Service Platform',
  description: '登录您的账户',
};

export default function Page() {
  return <LoginPage />;
}
