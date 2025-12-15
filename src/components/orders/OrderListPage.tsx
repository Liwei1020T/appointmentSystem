'use client';

import { useEffect, useState } from 'react';
import { getUserOrders, type OrderWithDetails } from '@/services/order.service';
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
      pending: '待支付',
      pending_payment_verification: '支付审核中',
      confirmed: '已确认',
      payment_rejected: '支付被拒',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_payment_verification: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      payment_rejected: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">我的订单</h1>

        {/* 筛选器 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待支付' },
            { value: 'pending_payment_verification', label: '审核中' },
            { value: 'confirmed', label: '已确认' },
            { value: 'completed', label: '已完成' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filter === item.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">还没有订单</p>
          <Link
            href="/booking"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            立即预约
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    订单号: {order.id.slice(0, 16)}
                  </p>
                  <p className="text-sm text-gray-500">
                    下单时间:{' '}
                    {order.createdAt || order.created_at
                      ? new Date(order.createdAt || order.created_at!).toLocaleString('zh-CN')
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
                    <p className="text-sm text-gray-600">球线型号</p>
                    <p className="font-medium text-lg">
                      {order.string?.brand || '未知品牌'} {order.string?.model || ''}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">创建时间</p>
                    <p className="font-medium">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* 右侧：金额信息 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">球线价格：</span>
                    <span>{formatAmount(toNum(order.price))}</span>
                  </div>
                  {toNum(order.discountAmount || order.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>优惠金额：</span>
                      <span>-{formatAmount(toNum(order.discountAmount || order.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>实付金额：</span>
                    <span className="text-blue-600">
                      {formatAmount(toNum(order.price) - toNum(order.discountAmount || order.discount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  查看详情
                </Link>

                {order.status === 'pending' && order.payments?.[0]?.id && (
                  <Link
                    href={`/payment/${order.payments[0].id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    立即支付
                  </Link>
                )}

                {order.status === 'payment_rejected' && order.payments?.[0]?.id && (
                  <Link
                    href={`/payment/${order.payments[0].id}`}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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
