/**
 * 个人资料页面路由 (Profile Route Page)
 * 
 * Next.js App Router 页面文件
 */

import ProfilePage from '@/features/profile/ProfilePage';

export const metadata = {
  title: '个人资料 | String Service Platform',
  description: '管理您的个人资料',
};

export default function Page() {
  return <ProfilePage />;
}
