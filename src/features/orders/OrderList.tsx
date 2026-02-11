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
import { subscribeToUserOrders, type OrderUpdateData } from '@/services/realtimeService';
import {
  getOrderStatusNotification,
  showBrowserNotification,
  playNotificationSound,
  OrderStatus as OrderStatusType
} from '@/lib/orderNotificationHelper';
import { getErrorMessage, resolveServiceType } from '@/lib/orderDetailUtils';
import { OrderStatus } from '@/components/OrderStatusBadge';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { Badge } from '@/components/Badge';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { OrderListSkeleton } from '@/components/skeletons';
import EmptyState from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { getOrderEtaEstimate } from '@/lib/orderEta';
import { Clock, CheckCircle, RefreshCw, XCircle, Disc, Banknote, MapPin, Smartphone, LucideIcon } from 'lucide-react';

interface OrderListProps {
  initialStatus?: OrderStatus;
}

interface SupabaseOrderUpdatePayload {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  old?: { id?: string; status?: string };
  new?: { id?: string; status?: string; updatedAt?: string; updated_at?: string };
}

interface UserOrdersUpdatePayload {
  orders: OrderUpdateData[];
}

function isSupabaseOrderUpdatePayload(payload: unknown): payload is SupabaseOrderUpdatePayload {
  return typeof payload === 'object' && payload !== null && 'eventType' in payload;
}

function isUserOrdersUpdatePayload(payload: unknown): payload is UserOrdersUpdatePayload {
  if (!payload || typeof payload !== 'object') return false;
  const maybeOrders = (payload as { orders?: unknown }).orders;
  return Array.isArray(maybeOrders);
}

function toNotificationStatus(status: string | null | undefined): OrderStatusType {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed' || status === 'picked_up') return 'completed';
  if (status === 'in_progress' || status === 'received') return 'in_progress';
  return 'pending';
}

function getOrderItemCount(order: OrderWithDetails): number {
  return Array.isArray(order.items) ? order.items.length : 0;
}

const resolvePaymentFlags = (order: OrderWithDetails) => {
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const hasCompletedPayment = payments.some(
    (payment) => payment.status === 'completed' || payment.status === 'success'
  );
  const hasActualPendingPayment = payments.some(
    (payment) =>
      payment.status === 'pending' &&
      payment.provider !== 'pending' &&
      payment.provider !== 'manual'
  );
  const hasPendingCashPayment = payments.some(
    (payment) => payment.status === 'pending' && payment.provider === 'cash'
  );
  const hasPendingTngVerification = payments.some(
    (payment) =>
      payment.status === 'pending_verification' && payment.provider === 'tng'
  );
  const finalAmount = Number(order.finalPrice ?? order.price ?? 0);
  const usePackage = Boolean(order.usePackage ?? order.use_package);
  const needsPayment =
    order.status === 'pending' &&
    !hasCompletedPayment &&
    !hasActualPendingPayment &&
    !hasPendingCashPayment &&
    !hasPendingTngVerification &&
    finalAmount > 0 &&
    !usePackage;

  return {
    hasCompletedPayment,
    hasActualPendingPayment,
    hasPendingCashPayment,
    hasPendingTngVerification,
    needsPayment,
  };
};

const getOrderNextAction = (order: OrderWithDetails) => {
  const {
    needsPayment,
    hasPendingCashPayment,
    hasPendingTngVerification,
    hasActualPendingPayment,
  } = resolvePaymentFlags(order);
  const isPickup = resolveServiceType(order) === 'pickup_delivery';

  if (order.status === 'cancelled') {
    return { label: '已取消', tone: 'danger' as const };
  }
  if (needsPayment) {
    return { label: '待付款', tone: 'warning' as const };
  }
  if (order.status === 'pending') {
    return { label: '等待处理', tone: 'info' as const };
  }
  if (hasPendingTngVerification) {
    return { label: '等待审核', tone: 'info' as const };
  }
  if (hasPendingCashPayment) {
    return { label: '待到店付款', tone: 'warning' as const };
  }
  if (order.status === 'in_progress') {
    return { label: isPickup ? '取送中' : '穿线中', tone: 'info' as const };
  }
  if (order.status === 'completed') {
    return { label: isPickup ? '配送中' : '可取拍', tone: 'success' as const };
  }
  if (hasActualPendingPayment) {
    return { label: '付款处理中', tone: 'info' as const };
  }
  return { label: '处理中', tone: 'neutral' as const };
};

const getEtaIcon = (tone: 'success' | 'warning' | 'info' | 'neutral') => {
  if (tone === 'success') return MapPin;
  return Clock;
};

const getOrderNextActionChips = (order: OrderWithDetails) => {
  const {
    needsPayment,
    hasPendingCashPayment,
    hasPendingTngVerification,
    hasActualPendingPayment,
  } = resolvePaymentFlags(order);
  const eta = getOrderEtaEstimate(order);
  const chips: Array<{
    label: string;
    tone: 'success' | 'warning' | 'info' | 'neutral';
    icon?: LucideIcon;
  }> = [
    {
      label: eta.label,
      tone: eta.tone,
      icon: getEtaIcon(eta.tone),
    },
  ];

  if (needsPayment) {
    chips.push({ label: '待付款', tone: 'warning', icon: Banknote });
  }
  if (hasPendingTngVerification) {
    chips.push({ label: '等待审核', tone: 'info', icon: Smartphone });
  }
  if (hasPendingCashPayment) {
    chips.push({ label: '待到店付款', tone: 'warning', icon: Banknote });
  }
  if (hasActualPendingPayment && !needsPayment) {
    chips.push({ label: '付款处理中', tone: 'info', icon: Clock });
  }

  return chips;
};

export default function OrderList({ initialStatus }: OrderListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>(initialStatus || 'all');
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
  const loadOrders = useCallback(async (status?: OrderStatus) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: err } = await getUserOrders(status);
      if (err) {
        setError(getErrorMessage(err, '加载订单失败'));
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载订单失败'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理订单实时更新
  const handleOrderUpdate = useCallback((payload: UserOrdersUpdatePayload | SupabaseOrderUpdatePayload) => {
    if (isSupabaseOrderUpdatePayload(payload)) {
      const { eventType, old, new: newData } = payload;

      if (eventType === 'UPDATE' && newData?.id && typeof newData.status === 'string') {
        const updatedOrderId = newData.id;
        const nextStatus = newData.status;
        const nextUpdatedAt = newData.updatedAt ?? newData.updated_at;
        let shouldRefresh = false;
        const scopedStatus = activeStatus === 'all' ? undefined : activeStatus;

        setOrders((prevOrders) => {
          const updatedOrders = prevOrders.map((order) => {
            if (order.id !== newData.id) return order;

            if (old?.status && old.status !== newData.status) {
              const orderInfo = order.string
                ? `${order.string.brand ?? ''} ${order.string.model ?? ''}`.trim()
                : '订单';

              const notification = getOrderStatusNotification(
                toNotificationStatus(old.status),
                toNotificationStatus(nextStatus),
                updatedOrderId,
                orderInfo || '订单'
              );

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

              playNotificationSound(toastType);
              showBrowserNotification(notification);
            }

            const nextOrder: OrderWithDetails = {
              ...order,
              status: nextStatus,
              ...(nextUpdatedAt ? { updatedAt: nextUpdatedAt } : {}),
            };

            if (
              scopedStatus &&
              (order.status === scopedStatus || nextOrder.status === scopedStatus) &&
              order.status !== nextOrder.status
            ) {
              shouldRefresh = true;
            }

            return nextOrder;
          });

          return scopedStatus ? updatedOrders.filter((order) => order.status === scopedStatus) : updatedOrders;
        });

        if (shouldRefresh) {
          void loadOrders(scopedStatus);
        }
        return;
      }

      if (eventType === 'INSERT' || eventType === 'DELETE') {
        void loadOrders(activeStatus === 'all' ? undefined : activeStatus);
      }
      return;
    }

    if (!isUserOrdersUpdatePayload(payload)) {
      return;
    }

    const updateMap = new Map(payload.orders.map((order) => [order.orderId, order]));
    const scopedStatus = activeStatus === 'all' ? undefined : activeStatus;
    let shouldRefresh = false;

    setOrders((prevOrders) => {
      const knownOrderIds = new Set(prevOrders.map((order) => order.id));
      if (payload.orders.some((item) => !knownOrderIds.has(item.orderId))) {
        shouldRefresh = true;
      }

      return prevOrders.map((order) => {
        const nextUpdate = updateMap.get(order.id);
        if (!nextUpdate || nextUpdate.status === order.status) {
          return order;
        }

        shouldRefresh = true;

        const orderInfo = order.string
          ? `${order.string.brand ?? ''} ${order.string.model ?? ''}`.trim()
          : '订单';

        const notification = getOrderStatusNotification(
          toNotificationStatus(order.status),
          toNotificationStatus(nextUpdate.status),
          order.id,
          orderInfo || '订单'
        );

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
        playNotificationSound(toastType);
        showBrowserNotification(notification);

        return {
          ...order,
          status: nextUpdate.status,
          updatedAt: nextUpdate.updatedAt,
        };
      });
    });

    if (shouldRefresh) {
      void loadOrders(scopedStatus);
    }
  }, [activeStatus, loadOrders]);

  // 初始化实时订阅
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const subscription = subscribeToUserOrders(userId, handleOrderUpdate);

      // 清理函数：取消订阅
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.user?.id, handleOrderUpdate]);

  // 初次加载
  useEffect(() => {
    void loadOrders(activeStatus === 'all' ? undefined : activeStatus);
  }, [activeStatus, loadOrders]);

  // 处理状态筛选切换
  const handleStatusChange = (status: OrderStatus | 'all') => {
    setActiveStatus(status);
  };

  // 跳转到订单详情
  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  /**
   * Repeat an order by preloading it into the booking flow.
   */
  const handleRepeatOrder = (event: React.MouseEvent, orderId: string) => {
    event.stopPropagation();
    router.push(`/booking?repeatOrderId=${encodeURIComponent(orderId)}`);
  };

  return (
    <div className={`
      space-y-4
      transition-all duration-700 ease-out
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* 分段式状态筛选 - 统一设计 */}
      <div className="bg-ink-surface rounded-xl p-1.5 shadow-sm border border-border-subtle">
        <div className="flex gap-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusChange(filter.value)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeStatus === filter.value
                ? 'bg-accent-soft text-accent shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-ink'
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
            // Status-based styling with Lucide icons
            const statusConfig: Record<string, {
              icon: LucideIcon;
              bgColor: string;
              borderColor: string;
              iconBg: string;
              textColor: string;
            }> = {
              pending: {
                icon: Clock,
                bgColor: 'bg-warning/5',
                borderColor: 'border-l-warning',
                iconBg: 'bg-warning/15',
                textColor: 'text-warning'
              },
              confirmed: {
                icon: CheckCircle,
                bgColor: 'bg-info/5',
                borderColor: 'border-l-info',
                iconBg: 'bg-info/15',
                textColor: 'text-info'
              },
              in_progress: {
                icon: RefreshCw,
                bgColor: 'bg-info/5',
                borderColor: 'border-l-info',
                iconBg: 'bg-info/15',
                textColor: 'text-info'
              },
              completed: {
                icon: CheckCircle,
                bgColor: 'bg-success/5',
                borderColor: 'border-l-success',
                iconBg: 'bg-success/15',
                textColor: 'text-success'
              },
              cancelled: {
                icon: XCircle,
                bgColor: 'bg-danger/5',
                borderColor: 'border-l-danger',
                iconBg: 'bg-danger/15',
                textColor: 'text-danger'
              },
            };

            const config = statusConfig[order.status] || statusConfig.pending;
            const itemCount = getOrderItemCount(order);
            const isMultiRacket = itemCount > 0;
            const nextAction = getOrderNextAction(order);
            const nextActionChips = getOrderNextActionChips(order);

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className={`
                  relative overflow-hidden rounded-xl border-l-4 ${config.borderColor}
                  bg-ink-surface border border-border-subtle shadow-card
                  p-5 cursor-pointer
                  transition-all duration-300 ease-out
                  hover:shadow-card-hover
                  hover:-translate-y-0.5 hover:scale-[1.01]
                  active:scale-[0.99]
                  group
                `}
              >
                {/* Top Row: Title + Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    {(() => {
                      const IconComponent = config.icon;
                      return (
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${config.iconBg} ${config.textColor}
                          transition-transform duration-300 group-hover:scale-110
                        `}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                      );
                    })()}

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      {isMultiRacket ? (
                        <>
                          <h3 className="font-semibold text-text-primary truncate">
                            多球拍订单
                          </h3>
                          <p className="text-sm text-text-secondary mt-0.5">
                            {itemCount} 支球拍
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
                  <div className="bg-ink rounded-lg p-3 text-center">
                    <p className="text-xs text-text-tertiary mb-1">
                      {isMultiRacket ? '球拍' : '拉力'}
                    </p>
                    <p className="font-semibold text-text-primary">
                      {isMultiRacket
                        ? `${itemCount} 支`
                        : `${order.tension || '-'} 磅`
                      }
                    </p>
                  </div>
                  <div className="bg-ink rounded-lg p-3 text-center">
                    <p className="text-xs text-text-tertiary mb-1">价格</p>
                    <p className="font-bold text-accent font-mono">
                      RM {Number(order.finalPrice ?? order.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-ink rounded-lg p-3 text-center">
                    <p className="text-xs text-text-tertiary mb-1">日期</p>
                    <p className="font-medium text-text-primary text-xs">
                      {formatDate(order.createdAt, 'MM/dd')}
                    </p>
                  </div>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.usePackage && (
                    <Badge variant="success" size="sm" interactive>
                      套餐
                    </Badge>
                  )}

                  {(order.discountAmount ?? 0) > 0 && !order.usePackage && (
                    <Badge variant="warning" size="sm" interactive>
                      优惠 RM {Number(order.discountAmount ?? 0).toFixed(0)}
                    </Badge>
                  )}

                  {order.status === 'completed' && (
                    <button
                      type="button"
                      onClick={(event) => handleRepeatOrder(event, order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Disc className="w-3.5 h-3.5" />
                      再来一单
                    </button>
                  )}

                  <Badge
                    variant={nextAction.tone === 'danger' ? 'error' : nextAction.tone}
                    size="sm"
                    interactive
                  >
                    {nextAction.label}
                  </Badge>
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

                {/* Next action chips */}
                {nextActionChips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextActionChips.map((chip, chipIndex) => {
                      const ChipIcon = chip.icon;
                      return (
                        <Badge
                          key={`${order.id}-chip-${chipIndex}`}
                          variant={chip.tone === 'neutral' ? 'neutral' : chip.tone}
                          size="sm"
                          interactive
                          className="gap-1.5"
                        >
                          {ChipIcon && <ChipIcon className="w-3.5 h-3.5" />}
                          <span>{chip.label}</span>
                        </Badge>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          type="no-orders"
          title="暂无订单"
          description={activeStatus === 'all' ? '您还没有任何订单' : `暂无${statusFilters.find(f => f.value === activeStatus)?.label}订单`}
          actionLabel="立即预约"
          onAction={() => router.push('/booking')}
        />
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
