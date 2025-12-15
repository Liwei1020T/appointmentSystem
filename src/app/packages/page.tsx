/**
 * 套餐列表路由页面
 */

import { Metadata } from 'next';
import PackagesPage from '@/features/packages/PackagesPage';

export const metadata: Metadata = {
  title: '购买套餐 | String Service Platform',
  description: '查看并购买优惠套餐',
};

export default function PackagesRoute() {
  return <PackagesPage />;
}
