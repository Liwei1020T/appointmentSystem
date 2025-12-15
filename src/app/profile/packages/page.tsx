/**
 * 我的套餐页面路由
 */

import MyPackagesPage from '@/features/profile/MyPackagesPage';

export const metadata = {
  title: '我的套餐 - String Service',
  description: '查看和管理您的套餐',
};

export default function PackagesRoute() {
  return <MyPackagesPage />;
}
