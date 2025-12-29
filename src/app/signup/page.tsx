/**
 * 注册页面路由 (Signup Route Page)
 * 
 * Next.js App Router 页面文件
 */

import SignupPage from '@/features/auth/SignupPage';
import PageLoading from '@/components/loading/PageLoading';
import { Suspense } from 'react';

export const metadata = {
  title: '注册 | String Service Platform',
  description: '创建您的账户，开始使用 String Service',
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SignupPage />
    </Suspense>
  );
}
