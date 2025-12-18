/**
 * 我的套餐页面路由
 */

/**
 * 说明：
 * - 统一使用 Prisma 迁移后的“我的套餐”实现（/api/packages/user）
 * - 避免旧版占位接口（如 /api/packages/my）导致用户看不到已激活套餐
 */

import MyPackagesPage from '@/features/packages/MyPackagesPage';

export const metadata = {
  title: '我的套餐 - String Service',
  description: '查看和管理您的套餐',
};

export default function PackagesRoute() {
  return <MyPackagesPage />;
}
