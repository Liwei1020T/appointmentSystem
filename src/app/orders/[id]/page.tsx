/**
 * 订单详情路由页面（动态路由）
 */

import { Metadata } from 'next';
import OrderDetailPage from '@/features/orders/OrderDetailPage';

export const metadata: Metadata = {
  title: '订单详情 | String Service Platform',
  description: '查看订单详细信息',
};

interface OrderDetailRouteProps {
  params: {
    id: string;
  };
}

export default function OrderDetailRoute({ params }: OrderDetailRouteProps) {
  return <OrderDetailPage orderId={params.id} />;
}
