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
import { getUserOrders, OrderWithDetails } from '@/services/orderService';
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
import { OrderListSkeleton } from '@/components/skeletons';
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
  const [isVisible, setIsVisible] = useState(false);

  // 页面进入动画
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
        setError((err as any)?.message || err || '加载订单失败');
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
    <div className={`
      space-y-4
      transition-all duration-700 ease-out
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* 分段式状态筛选 - 统一设计 */}
      <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        <div className="flex gap-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusChange(filter.value)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeStatus === filter.value
                ? 'bg-orange-50 text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && <OrderListSkeleton />}

      {/* 错误提示 */}
      {error && !loading && (
        <Card className="p-6 text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={() => loadOrders(activeStatus === 'all' ? undefined : activeStatus)} className="mt-4">
            重试
          </Button>
        </Card>
      )}

      {/* 订单列表 */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            // Status-based styling
            const statusConfig: Record<string, {
              icon: string;
              bgColor: string;
              borderColor: string;
              iconBg: string;
              textColor: string;
            }> = {
              pending: {
                icon: '⏳',
                bgColor: 'bg-warning/5',
                borderColor: 'border-l-warning',
                iconBg: 'bg-warning/15',
                textColor: 'text-warning'
              },
              confirmed: {
                icon: '✅',
                bgColor: 'bg-info/5',
                borderColor: 'border-l-info',
                iconBg: 'bg-info/15',
                textColor: 'text-info'
              },
              in_progress: {
                icon: '🔧',
                bgColor: 'bg-info/5',
                borderColor: 'border-l-info',
                iconBg: 'bg-info/15',
                textColor: 'text-info'
              },
              completed: {
                icon: '✓',
                bgColor: 'bg-success/5',
                borderColor: 'border-l-success',
                iconBg: 'bg-success/15',
                textColor: 'text-success'
              },
              cancelled: {
                icon: '✕',
                bgColor: 'bg-danger/5',
                borderColor: 'border-l-danger',
                iconBg: 'bg-danger/15',
                textColor: 'text-danger'
              },
            };

            const config = statusConfig[order.status] || statusConfig.pending;
            const isMultiRacket = (order as any).items?.length > 0;

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className={`
                  relative overflow-hidden rounded-xl border-l-4 ${config.borderColor}
                  bg-white border border-gray-100 shadow-sm
                  p-5 cursor-pointer
                  transition-all duration-300 ease-out
                  hover:shadow-lg hover:shadow-gray-200/50
                  hover:-translate-y-0.5 hover:scale-[1.01]
                  active:scale-[0.99]
                  group
                `}
              >
                {/* Top Row: Title + Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${config.iconBg} ${config.textColor}
                      transition-transform duration-300 group-hover:scale-110
                    `}>
                      <span className="text-lg">{config.icon}</span>
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      {isMultiRacket ? (
                        <>
                          <h3 className="font-semibold text-text-primary truncate">
                            🎾 多球拍订单
                          </h3>
                          <p className="text-sm text-text-secondary mt-0.5">
                            {(order as any).items.length} 支球拍
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-text-primary truncate">
                            {order.string?.brand} {order.string?.model}
                          </h3>
                          <p className="text-sm text-text-secondary mt-0.5 truncate">
                            {order.string?.specification || '标准穿线服务'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      {isMultiRacket ? '球拍' : '拉力'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {isMultiRacket
                        ? `${(order as any).items.length} 支`
                        : `${order.tension || '-'} 磅`
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">价格</p>
                    <p className="font-bold text-orange-500" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                      RM {Number(order.finalPrice ?? order.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">日期</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {formatDate(order.createdAt, 'MM/dd')}
                    </p>
                  </div>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.usePackage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                      📦 套餐
                    </span>
                  )}

                  {(order.discountAmount ?? 0) > 0 && !order.usePackage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning">
                      🏷️ 优惠 RM {Number(order.discountAmount ?? 0).toFixed(0)}
                    </span>
                  )}

                  {/* Arrow indicator */}
                  <div className="ml-auto flex items-center gap-1 text-text-tertiary text-xs group-hover:text-accent transition-colors">
                    <span>查看详情</span>
                    <svg
                      className="w-4 h-4 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && orders.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-text-tertiary mb-4">
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
          <h3 className="text-lg font-semibold text-text-primary mb-2">暂无订单</h3>
          <p className="text-text-secondary mb-6">
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
