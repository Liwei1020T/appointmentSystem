/**
 * 订单列表组件 (Order List)
 * 
 * 显示用户订单列表，支持状态筛选
 * 集成实时订阅功能，自动更新订单状态
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getUserOrders, OrderWithDetails } from '@/services/order.service';
import { subscribeToUserOrders, RealtimeSubscription } from '@/services/realtimeService';
import { 
  getOrderStatusNotification, 
  showBrowserNotification,
  playNotificationSound,
  OrderStatus as OrderStatusType
} from '@/lib/orderNotificationHelper';
import { Order } from '@/types';
import { OrderStatus } from '@/components/OrderStatusBadge';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { formatDate } from '@/lib/utils';

interface OrderListProps {
  initialStatus?: OrderStatus;
}

export default function OrderList({ initialStatus }: OrderListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>(initialStatus || 'all');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeSubscription | null>(null);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' 
  }>({ show: false, message: '', type: 'info' });

  // 状态筛选选项
  const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  // 加载订单数据
  const loadOrders = async (status?: OrderStatus) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: err } = await getUserOrders(status);
      if (err) {
        setError(err?.message || err || '加载订单失败');
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err: any) {
      setError(err.message || '加载订单失败');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理订单实时更新
  const handleOrderUpdate = useCallback((payload: any) => {
    const { eventType, old, new: newData } = payload;

    if (eventType === 'UPDATE') {
      setOrders((prevOrders) => {
        // 找到被更新的订单
        const updatedOrders = prevOrders.map((order) => {
          if (order.id === newData.id) {
            // 检查状态是否变化
            if (old.status !== newData.status) {
              // 显示通知
              const orderInfo = order.string 
                ? `${order.string.brand} ${order.string.model}` 
                : '订单';
              
              const notification = getOrderStatusNotification(
                old.status as OrderStatusType,
                newData.status as OrderStatusType,
                newData.id,
                orderInfo
              );

              // 显示 Toast 通知
              const toastType =
                notification.type === 'error'
                  ? 'error'
                  : notification.type === 'success'
                  ? 'success'
                  : 'info';
              setToast({
                show: true,
                message: notification.message,
                type: toastType,
              });

              // 播放通知音效
              playNotificationSound(toastType);

              // 显示浏览器通知（如果已授权）
              showBrowserNotification(notification);
            }

            // 更新订单数据
            return { ...order, ...newData };
          }
          return order;
        });

        // 根据当前筛选条件过滤订单
        if (activeStatus === 'all') {
          return updatedOrders;
        } else {
          return updatedOrders.filter((o) => o.status === activeStatus);
        }
      });
    } else if (eventType === 'INSERT') {
      // 新订单插入
      loadOrders(activeStatus === 'all' ? undefined : activeStatus);
    } else if (eventType === 'DELETE') {
      // 订单被删除
      setOrders((prevOrders) => 
        prevOrders.filter((order) => order.id !== old.id)
      );
    }
  }, [activeStatus]);

  // 初始化实时订阅
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const subscription = subscribeToUserOrders(userId, handleOrderUpdate);
      setRealtimeChannel(subscription);

      // 清理函数：取消订阅
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.user?.id, handleOrderUpdate]);

  // 初次加载
  useEffect(() => {
    loadOrders(activeStatus === 'all' ? undefined : activeStatus);
  }, [activeStatus]);

  // 处理状态筛选切换
  const handleStatusChange = (status: OrderStatus | 'all') => {
    setActiveStatus(status);
  };

  // 跳转到订单详情
  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="space-y-4">
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleStatusChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* 错误提示 */}
      {error && !loading && (
        <Card className="p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => loadOrders(activeStatus === 'all' ? undefined : activeStatus)} className="mt-4">
            重试
          </Button>
        </Card>
      )}

      {/* 订单列表 */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOrderClick(order.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {order.string?.brand} {order.string?.model}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {order.string?.specification}
                  </p>
                </div>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">拉力</p>
                  <p className="font-medium text-slate-900">{order.tension} 磅</p>
                </div>
                <div>
                  <p className="text-slate-600">价格</p>
                  <p className="font-medium text-slate-900">
                    RM {Number(order.final_price ?? order.price ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {order.use_package && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    使用套餐
                  </span>
                </div>
              )}

              {(order.discount_amount ?? 0) > 0 && !order.use_package && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                    优惠 RM {Number(order.discount_amount ?? 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  下单时间：{order.created_at || order.createdAt ? formatDate(order.created_at || order.createdAt!) : '未知'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && orders.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无订单</h3>
          <p className="text-slate-600 mb-6">
            {activeStatus === 'all' ? '您还没有任何订单' : `暂无${statusFilters.find(f => f.value === activeStatus)?.label}订单`}
          </p>
          <Button onClick={() => router.push('/booking')}>立即预约</Button>
        </Card>
      )}

      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
