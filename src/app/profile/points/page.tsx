/**
 * 积分中心页面路由
 */

import PointsCenterPage from '@/features/profile/PointsCenterPage';

export const metadata = {
  title: '积分中心 - String Service',
  description: '查看积分余额和兑换优惠券',
};

export default function PointsRoute() {
  return <PointsCenterPage />;
}
