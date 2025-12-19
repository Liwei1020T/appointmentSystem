/**
 * 订单列表路由页面
 */

import { Metadata } from 'next';
import OrderList from '@/features/orders/OrderList';

export const metadata: Metadata = {
  title: '我的订单 | String Service Platform',
  description: '查看订单列表和状态',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-ink">
      {/* 顶部导航 */}
      <div className="bg-ink-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-text-primary">我的订单</h1>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="max-w-2xl mx-auto p-4">
        <OrderList />
      </div>
    </div>
  );
}
