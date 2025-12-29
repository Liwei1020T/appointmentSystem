'use client';

import { useEffect, useState } from 'react';
import { getUserOrders, type OrderWithDetails } from '@/services/orderService';
import { formatAmount } from '@/lib/payment-helpers';
import Link from 'next/link';

// Just use OrderWithDetails directly
type Order = OrderWithDetails;

// Helper to convert Prisma Decimal to number
const toNum = (val: number | { toNumber(): number } | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object' && 'toNumber' in val) return val.toNumber();
  return Number(val);
};

// Format date helper
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '未知';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await getUserOrders(
        filter === 'all' ? undefined : filter
      );
      if (error) {
        console.error('获取订单失败:', error);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消',
      payment_rejected: '支付被拒',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-warning/15 text-warning',
      in_progress: 'bg-info-soft text-info',
      completed: 'bg-success/15 text-success',
      cancelled: 'bg-ink-elevated text-text-tertiary',
      payment_rejected: 'bg-danger/15 text-danger',
    };
    return colorMap[status] || 'bg-ink-elevated text-text-secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-tertiary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-4">我的订单</h1>

        {/* 筛选器 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待处理' },
            { value: 'in_progress', label: '处理中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${filter === item.value
                ? 'bg-accent text-text-onAccent'
                : 'bg-ink-elevated text-text-secondary border border-border-subtle'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-ink-surface rounded-lg shadow p-12 text-center border border-border-subtle">
          <p className="text-text-tertiary mb-4">还没有订单</p>
          <Link
            href="/booking"
            className="inline-block px-6 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
          >
            立即预约
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-ink-surface rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-border-subtle"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-text-tertiary">
                    订单号: {order.id.slice(0, 16)}
                  </p>
                  <p className="text-sm text-text-tertiary">
                    下单时间:{' '}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString('zh-CN')
                      : '未知'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 左侧：订单信息 */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-text-tertiary">球线型号</p>
                    <p className="font-medium text-lg text-text-primary">
                      {order.string?.brand || '未知品牌'} {order.string?.model || ''}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-text-tertiary">创建时间</p>
                    <p className="font-medium text-text-secondary">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* 右侧：金额信息 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">球线价格：</span>
                    <span className="text-text-primary font-mono">{formatAmount(toNum(order.price))}</span>
                  </div>
                  {toNum(order.discountAmount || order.discount) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>优惠金额：</span>
                      <span className="font-mono">-{formatAmount(toNum(order.discountAmount || order.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-border-subtle pt-2">
                    <span>实付金额：</span>
                    <span className="text-accent font-mono">
                      {formatAmount(toNum(order.price) - toNum(order.discountAmount || order.discount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  查看详情
                </Link>

                {order.status === 'pending' && order.payments?.[0]?.id && (
                  <Link
                    href={`/payment/${order.payments[0].id}`}
                    className="px-4 py-2 bg-success text-text-primary rounded-lg hover:shadow-md"
                  >
                    立即支付
                  </Link>
                )}

                {order.status === 'payment_rejected' && order.payments?.[0]?.id && (
                  <Link
                    href={`/payment/${order.payments[0].id}`}
                    className="px-4 py-2 bg-warning text-text-primary rounded-lg hover:shadow-md"
                  >
                    重新上传凭证
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
