/**
 * 最近订单组件 (Recent Orders)
 * 
 * 显示用户最近的订单列表（最新 5 条）
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Spinner } from '@/components';
import { getRecentOrders } from '@/services/homeService';
import { Order } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

// 订单状态映射
const statusConfig = {
  pending: { label: '待处理', variant: 'yellow' as const },
  in_progress: { label: '处理中', variant: 'blue' as const },
  completed: { label: '已完成', variant: 'green' as const },
  cancelled: { label: '已取消', variant: 'slate' as const },
};

export default function RecentOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    setLoading(true);
    try {
      const data = await getRecentOrders(undefined, 5);
      if (data) {
        setOrders(data as any);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <Spinner size="medium" />
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">最近订单</h2>
          </div>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-4">您还没有任何订单</p>
            <button
              onClick={() => router.push('/booking')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              立即预约 →
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">最近订单</h2>
          <button
            onClick={() => router.push('/orders')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部
          </button>
        </div>

        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig];
            const badgeVariant =
              status?.variant === 'green'
                ? 'success'
                : status?.variant === 'yellow'
                ? 'warning'
                : status?.variant === 'slate'
                ? 'neutral'
                : status?.variant === 'blue'
                ? 'blue'
                : 'neutral';
            
            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">
                      {order.string?.brand} {order.string?.model}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {order.string?.specification} · {order.tension}磅
                    </p>
                  </div>
                  <Badge variant={badgeVariant}>
                    {status?.label || order.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {formatDate(order.created_at)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(order.final_price ?? order.price ?? 0)}
                  </span>
                </div>

                {order.use_package && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    使用套餐抵扣
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
