/**
 * 订单状态徽章组件 (Order Status Badge)
 * 
 * 显示订单状态，并根据不同状态使用不同颜色
 */

import React from 'react';

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

// 状态配置
const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: '待处理',
    color: 'text-warning',
    bgColor: 'bg-warning/15',
  },
  in_progress: {
    label: '处理中',
    color: 'text-info',
    bgColor: 'bg-info-soft',
  },
  completed: {
    label: '已完成',
    color: 'text-success',
    bgColor: 'bg-success/15',
  },
  cancelled: {
    label: '已取消',
    color: 'text-text-secondary',
    bgColor: 'bg-ink-elevated',
  },
};

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
