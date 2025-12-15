/**
 * 忘记密码页面路由 (Forgot Password Route Page)
 * 
 * Next.js App Router 页面文件
 */

import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';

export const metadata = {
  title: '忘记密码 | String Service Platform',
  description: '重置您的密码',
};

export default function Page() {
  return <ForgotPasswordPage />;
}
