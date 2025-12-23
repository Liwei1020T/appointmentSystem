/**
 * 订单列表路由页面
 */

import { Metadata } from 'next';
import OrderList from '@/features/orders/OrderList';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '我的订单 | String Service Platform',
  description: '查看订单列表和状态',
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-ink">
      {/* 页面头部 */}
      <div className="bg-ink-surface border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">我的订单</h1>
            <p className="text-sm text-text-tertiary mt-1">查看您的订单状态和历史记录</p>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="max-w-2xl mx-auto p-4">
        <OrderList />
      </div>
    </div>
  );
}
