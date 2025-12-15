/**
 * 我的订单页面路由
 */

import MyOrdersPage from '@/features/profile/MyOrdersPage';

export const metadata = {
  title: '我的订单 - String Service',
  description: '查看和管理您的订单历史',
};

export default function OrdersRoute() {
  return <MyOrdersPage />;
}
