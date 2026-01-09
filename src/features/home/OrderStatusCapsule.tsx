/**
 * Order status capsule (Home quick status + repeat entry)
 *
 * Displays the latest order status with a primary CTA and quick reorder option.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card } from '@/components';
import SectionLoading from '@/components/loading/SectionLoading';
import { formatDate } from '@/lib/utils';
interface OrderSummary {
  id: string;
  status: string;
  created_at?: string;
  createdAt?: string | Date;
  string?: {
    brand?: string;
    model?: string;
  };
  items?: Array<{ id: string }>;
}

interface OrderStatusCapsuleProps {
  order?: OrderSummary | null;
  loading?: boolean;
}

const statusMeta: Record<
  string,
  { label: string; variant: 'warning' | 'info' | 'success' | 'neutral'; hint: string; actionLabel: string }
> = {
  pending: {
    label: '待付款',
    variant: 'warning',
    hint: '完成付款后进入穿线流程',
    actionLabel: '去付款',
  },
  in_progress: {
    label: '穿线中',
    variant: 'info',
    hint: '处理中，完成后将通知',
    actionLabel: '查看进度',
  },
  stringing: {
    label: '穿线中',
    variant: 'info',
    hint: '处理中，完成后将通知',
    actionLabel: '查看进度',
  },
  completed: {
    label: '已完成',
    variant: 'success',
    hint: '球拍已完成，可安排取拍',
    actionLabel: '查看详情',
  },
  ready: {
    label: '待取拍',
    variant: 'success',
    hint: '球拍已就绪，欢迎取拍',
    actionLabel: '查看详情',
  },
  cancelled: {
    label: '已取消',
    variant: 'neutral',
    hint: '如需服务可再次预约',
    actionLabel: '查看详情',
  },
};

const getOrderTitle = (order: OrderSummary) => {
  const items = (order as any).items;
  if (Array.isArray(items) && items.length > 1) {
    return `多球拍订单 · ${items.length} 支`;
  }
  const stringInfo = order.string;
  if (stringInfo?.brand || stringInfo?.model) {
    return `${stringInfo.brand || ''} ${stringInfo.model || ''}`.trim();
  }
  return `订单 #${order.id.slice(0, 6).toUpperCase()}`;
};

export default function OrderStatusCapsule({
  order,
  loading = false,
}: OrderStatusCapsuleProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card>
        <SectionLoading label="加载订单状态..." minHeightClassName="min-h-[140px]" />
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <div className="p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">订单进度</p>
          <h2 className="text-lg font-bold text-text-primary font-display">暂无进行中的订单</h2>
          <p className="text-sm text-text-secondary">创建新订单开始预约</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-3 w-full sm:w-auto"
            onClick={() => router.push('/booking')}
          >
            立即预约
          </Button>
        </div>
      </Card>
    );
  }

  const statusKey = order.status as string;
  const meta = statusMeta[statusKey] || {
    label: '订单更新中',
    variant: 'neutral',
    hint: '查看详情了解最新进度',
    actionLabel: '查看详情',
  };

  const createdAt = order.created_at || (order as any).createdAt;
  const actionUrl = statusKey === 'pending'
    ? `/orders/${order.id}?action=pay`
    : `/orders/${order.id}`;

  return (
    <Card>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">当前订单</p>
            <h2 className="text-lg font-bold text-text-primary font-display mt-1">
              {getOrderTitle(order)}
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              #{order.id.slice(0, 6).toUpperCase()} · {formatDate(createdAt)}
            </p>
          </div>
          <Badge variant={meta.variant} className="mt-1">
            {meta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-accent/70 pulse-glow" />
          <span>{meta.hint}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => router.push(actionUrl)}
          >
            {meta.actionLabel}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => router.push(`/booking?repeatOrderId=${order.id}`)}
          >
            一键复单
          </Button>
        </div>
      </div>
    </Card>
  );
}
