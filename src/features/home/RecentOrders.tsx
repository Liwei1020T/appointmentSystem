/**
 * 最近订单组件 (Recent Orders)
 * 
 * 行动导向设计：每行一个订单，状态徽标 + 动作按钮
 * 最多显示 3 条
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Spinner } from '@/components';
import { getRecentOrders } from '@/services/homeService';
import { Order } from '@/types';
import { formatDate } from '@/lib/utils';

// 订单状态配置
const statusConfig: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'neutral'; icon: string }> = {

  pending: { label: '待付款', variant: 'warning', icon: '💳' },
  pending_payment: { label: '待付款', variant: 'warning', icon: '💳' },
  in_progress: { label: '穿线中', variant: 'info', icon: '🔧' },
  stringing: { label: '穿线中', variant: 'info', icon: '🔧' },
  completed: { label: '已完成', variant: 'success', icon: '✅' },
  ready: { label: '待取拍', variant: 'success', icon: '📦' },
  cancelled: { label: '已取消', variant: 'neutral', icon: '✕' },
};

// 根据状态获取动作按钮配置
const getActionConfig = (status: string) => {
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return { label: '去付款', color: 'bg-warning text-white' };
    case 'in_progress':
    case 'stringing':
      return { label: '查看进度', color: 'bg-info text-white' };
    case 'completed':
    case 'ready':
      return { label: '查看详情', color: 'bg-success text-white' };
    default:
      return { label: '查看', color: 'bg-ink-elevated text-text-primary' };
  }
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
      const data = await getRecentOrders(undefined, 3); // 只获取3条
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

  const handleAction = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const status = order.status;

    if (status === 'pending' || status === 'pending_payment') {
      // 跳转到支付页面
      router.push(`/orders/${order.id}?action=pay`);
    } else {
      // 查看订单详情
      router.push(`/orders/${order.id}`);
    }
  };

  // 获取订单显示名称
  const getOrderName = (order: Order) => {
    const items = (order as any).items;
    if (items && items.length > 1) {
      return `多球拍订单 (${items.length}支)`;
    }
    if (order.string?.brand && order.string?.model) {
      return `${order.string.brand} ${order.string.model}`;
    }
    return `订单 #${order.id.slice(0, 6)}`;
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
            <h2 className="text-lg font-bold text-text-primary">最近订单</h2>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary mb-3">暂无订单记录</p>
            <button
              onClick={() => router.push('/booking')}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              立即预约穿线 →
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
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            最近订单
          </h2>
          <button
            onClick={() => router.push('/orders')}
            className="text-sm text-accent hover:text-accent/80 font-medium"
          >
            全部订单 →
          </button>
        </div>

        {/* 紧凑的订单列表 */}
        <div className="space-y-2">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const action = getActionConfig(order.status);

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-ink-elevated/50 hover:bg-ink-elevated border border-border-subtle hover:border-border-default transition-all cursor-pointer group"
              >
                {/* 状态图标 */}
                <span className="text-lg flex-shrink-0">{status.icon}</span>

                {/* 订单信息 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {getOrderName(order)}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    #{order.id.slice(0, 6).toUpperCase()} · {formatDate(order.created_at || (order as any).createdAt)}
                  </p>
                </div>

                {/* 状态徽标 */}
                <Badge variant={status.variant} className="flex-shrink-0">
                  {status.label}
                </Badge>

                {/* 动作按钮 */}
                <button
                  onClick={(e) => handleAction(e, order)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${action.color} hover:opacity-90 shadow-sm`}
                >
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* 快捷预约按钮 */}
        <button
          onClick={() => router.push('/booking')}
          className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-border-subtle text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm font-medium flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          预约新的穿线
        </button>
      </div>
    </Card>
  );
}

