/**
 * 订单列表路由页面
 */

import { Metadata } from 'next';
import OrderList from '@/features/orders/OrderList';
import PageHeader from '@/components/layout/PageHeader';

export const metadata: Metadata = {
  title: '我的订单 | String Service Platform',
  description: '查看订单列表和状态',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="我的订单"
        subtitle="查看您的订单状态和历史记录"
      />

      {/* 订单列表 */}
      <div className="max-w-2xl mx-auto p-4">
        <OrderList />
      </div>
    </div>
  );
}
