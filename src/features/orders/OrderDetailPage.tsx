/**
 * 订单详情页组件 (Order Detail Page)
 * 
 * 显示订单完整信息，包括球线详情、价格明细、支付信息、状态时间线等
 * 集成实时订阅功能，自动更新订单状态
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById, cancelOrder } from '@/services/orderService';
import { subscribeToOrderUpdates } from '@/services/realtimeService';
import { getOrderReview, canReviewOrder, OrderReview } from '@/services/reviewService';
import {
  getOrderStatusNotification,
  showBrowserNotification,
  playNotificationSound,
  OrderStatus as OrderStatusType,
} from '@/lib/orderNotificationHelper';
import { Order } from '@/types';
import Card from '@/components/Card';
import PageLoading from '@/components/loading/PageLoading';
import Button from '@/components/Button';
import OrderStatusBadge, { OrderStatus } from '@/components/OrderStatusBadge';
import OrderTimeline from '@/components/OrderTimeline';
import OrderSummaryCard from '@/components/OrderSummaryCard';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import OrderPhotosDisplay from '@/components/OrderPhotosDisplay';
import OrderPaymentSection from '@/components/OrderPaymentSection';
import { formatDate, generateShortCode } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/layout/PageHeader';

interface OrderDetailPageProps {
  orderId: string;
}

export default function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [review, setReview] = useState<OrderReview | null>(null);
  const [canReview, setCanReview] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 加载订单详情
  const loadOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getOrderById(orderId);
      setOrder(data as any);
    } catch (err: any) {
      setError(err.message || '加载订单失败');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // 静默刷新订单数据（不显示加载状态，避免页面闪烁）
  const refreshOrderSilently = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data as any);
    } catch (err: any) {
      console.error('静默刷新订单失败:', err);
    }
  };

  // 处理订单实时更新
  const handleOrderUpdate = useCallback((payload: any) => {
    const { eventType, old, new: newData } = payload;

    if (eventType === 'UPDATE') {
      setOrder((prevOrder) => {
        if (!prevOrder || prevOrder.id !== newData.id) {
          return prevOrder;
        }

        // 检查状态是否变化
        if (old.status !== newData.status) {
          const orderInfo = prevOrder.string
            ? `${prevOrder.string.brand} ${prevOrder.string.model}`
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
        return { ...prevOrder, ...newData };
      });
    }
  }, []);

  // 初始化实时订阅
  useEffect(() => {
    if (userId && orderId) {
      const channel = subscribeToOrderUpdates(orderId, handleOrderUpdate);
      setRealtimeChannel(channel);

      // 清理函数：取消订阅
      return () => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        }
      };
    }
  }, [userId, orderId, handleOrderUpdate]);

  // 初始加载
  useEffect(() => {
    loadOrder();
    loadReview();
  }, [orderId]);

  // 加载评价数据
  const loadReview = async () => {
    try {
      const data = await getOrderReview(orderId);
      setReview(data);

      // 检查是否可以评价
      if (userId) {
        const result = await canReviewOrder(orderId, userId);
        setCanReview(result);
      }
    } catch (error) {
      console.error('Error loading review:', error);
    }
  };

  // 评价成功回调
  const handleReviewSuccess = (newReview?: OrderReview) => {
    setShowReviewForm(false);
    if (newReview) {
      setReview(newReview);
    } else {
      loadReview();
    }
    setToast({
      show: true,
      message: '评价成功！已获得 10 积分奖励',
      type: 'success',
    });
  };

  // 处理取消订单
  const handleCancelOrder = async () => {
    setCancelling(true);

    try {
      await cancelOrder(orderId);
      setToast({
        show: true,
        message: '订单已取消',
        type: 'success',
      });
      loadOrder(); // 重新加载订单
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '取消订单失败',
        type: 'error',
      });
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  // 加载状态
  if (loading) {
    return <PageLoading />;
  }

  // 错误状态
  if (error || !order) {
    return (
      <div className="min-h-screen bg-ink p-4">
        <Card className="p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-danger mb-4">{error || '订单不存在'}</p>
          <Button onClick={() => router.push('/orders')}>返回订单列表</Button>
        </Card>
      </div>
    );
  }

  // Normalize monetary values because API can return numeric strings
  const finalAmount = Number(order.final_price ?? order.price ?? 0);
  const discountAmount = Number(order.discount_amount ?? 0);
  const createdAt = order.created_at ?? (order as any).createdAt;
  const updatedAt = order.updated_at ?? (order as any).updatedAt;

  // 找到已完成的支付记录以获取正确的确认时间
  const completedPayment = order.payments?.find((p: any) => p.status === 'success' || p.status === 'completed') as any;
  const paymentRecord = completedPayment || order.payments?.[0];
  // 优先使用 metadata.verifiedAt（管理员确认时间），其次使用 updated_at
  const paymentConfirmedAt = completedPayment?.metadata?.verifiedAt
    || completedPayment?.metadata?.confirmed_at
    || (paymentRecord as any)?.updated_at
    || updatedAt;
  const paymentPendingAt = (paymentRecord as any)?.created_at || createdAt;
  const inProgressAt = (order as any).in_progress_at || updatedAt;
  const packageName = order.packageUsed?.package?.name || '配套服务';
  const packageRemainingCount = order.packageUsed?.remaining;
  const packageExpiry = order.packageUsed?.expiry ?? order.packageUsed?.expires_at;

  // 判断支付状态：检查是否有已完成的支付记录（'success' 是确认后的状态，'completed' 是兼容状态）
  const hasCompletedPayment =
    order.payments?.some((p: any) => p.status === 'completed' || p.status === 'success') || false;

  // 检查是否有真正的待确认支付（用户已选择了支付方式，不是 'pending' provider）
  const hasActualPendingPayment =
    order.payments?.some((p: any) => p.status === 'pending' && p.provider !== 'pending' && p.provider !== 'manual') || false;

  const hasPendingCashPayment =
    order.payments?.some((p: any) => p.status === 'pending' && p.provider === 'cash') || false;

  // TNG 支付已上传收据，等待审核
  const hasPendingTngVerification =
    order.payments?.some((p: any) => p.status === 'pending_verification' && p.provider === 'tng') || false;

  // 只有在没有完成支付、没有真正的待确认支付时才显示支付界面
  // provider='pending' 的支付记录表示用户还没选择支付方式，应该显示支付选择界面
  const needsPayment =
    order.status === 'pending' && !hasCompletedPayment && !hasActualPendingPayment && !hasPendingCashPayment && !hasPendingTngVerification && finalAmount > 0 && !order.use_package;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="订单详情" />

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* 状态时间线卡片 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-text-tertiary">
              下单时间: {formatDate(createdAt, 'yyyy/MM/dd HH:mm')}
            </div>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>

          {/* 横向时间线 */}
          <OrderTimeline
            currentStatus={order.status as any}
            createdAt={createdAt as any}
            updatedAt={updatedAt as any}
            completedAt={order.completed_at}
            cancelledAt={order.cancelled_at || undefined}
            hasPayment={!!order.payments && order.payments.length > 0}
            paymentStatus={
              // 优先使用已完成的支付状态，否则使用第一个支付的状态
              order.payments?.find((p: any) => p.status === 'success' || p.status === 'completed')?.status
              || order.payments?.[0]?.status
            }
            usePackage={!!order.use_package}
            paymentConfirmedAt={paymentConfirmedAt as any}
            inProgressAt={inProgressAt as any}
            paymentPendingAt={paymentPendingAt as any}
          />
        </Card>

        {/* 订单摘要卡 - 关键信息与行动按钮 */}
        <OrderSummaryCard
          order={order as any}
          hasReview={!!review}
          onPayClick={() => setShowPayment(true)}
          onReviewClick={() => {
            setShowReviewForm(true);
            // 滚动到评价区域
            setTimeout(() => {
              document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          onCancelClick={() => setShowCancelModal(true)}
        />

        {/* 球拍清单 - 可折叠带图片 */}
        <Card className="p-0 overflow-hidden">
          <details>
            <summary className="px-5 py-4 cursor-pointer hover:bg-ink-surface/30 transition-colors flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                🎾 {(order as any).items?.length > 0
                  ? `球拍清单 (${(order as any).items.length} 支)`
                  : '球线信息'
                }
              </h2>
              <span className="text-sm text-accent font-mono font-semibold">
                RM {Number(order.price).toFixed(2)}
              </span>
            </summary>

            <div className="px-5 pb-5 space-y-2">
              {/* 多球拍订单 */}
              {(order as any).items?.length > 0 ? (
                (order as any).items.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="bg-ink-elevated rounded-lg p-3 border border-border-subtle flex items-center gap-3"
                  >
                    {/* 球拍照片 */}
                    {(item.racketPhoto || item.racket_photo) ? (
                      <img
                        src={item.racketPhoto || item.racket_photo}
                        alt={`球拍 ${index + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border border-border-subtle flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🎾</span>
                      </div>
                    )}

                    {/* 球线信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-accent text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-medium text-text-primary text-sm truncate">
                          {item.string?.brand} {item.string?.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                        <span>主{item.tensionVertical || item.tension_vertical}/横{item.tensionHorizontal || item.tension_horizontal} 磅</span>
                        {item.notes && <span className="truncate">· {item.notes}</span>}
                      </div>
                    </div>

                    {/* 价格 */}
                    <div className="text-sm font-bold text-accent font-mono flex-shrink-0">
                      RM {Number(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                /* 单球拍订单（旧格式兼容） */
                <div className="bg-ink-elevated rounded-lg p-3 border border-border-subtle flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-ink-surface border border-border-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎾</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm">
                      {order.string?.brand} {order.string?.model}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {(() => {
                        const match = order.notes?.match(/\[竖\/横分拉:\s*(\d+)\/(\d+)\s*LBS\]/);
                        if (match) return `主${match[1]}/横${match[2]} 磅`;
                        const v = (order as any).tension_vertical || order.tension;
                        const h = (order as any).tension_horizontal || order.tension;
                        return `主${v}/横${h} 磅`;
                      })()}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-accent font-mono flex-shrink-0">
                    RM {Number(order.price).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </details>
        </Card>

        {/* 现金支付待确认提示 - 仅在订单pending状态时显示 */}
        {hasPendingCashPayment && order.status === 'pending' && (
          <Card className="p-6 border-2 border-warning/40 bg-ink-elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warning/15 rounded-full flex items-center justify-center text-2xl border border-warning/30">
                  💵
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">现金支付待确认</h2>
                  <p className="text-sm text-text-secondary">
                    请到店支付现金
                  </p>
                </div>
              </div>
              <div className="bg-warning text-text-primary text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                待收款
              </div>
            </div>

            <div className="bg-ink-surface border-2 border-warning/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-warning/15 rounded-full flex items-center justify-center flex-shrink-0 border border-warning/30">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-text-primary mb-2">
                    等待管理员确认收款
                  </p>
                  <div className="bg-ink-elevated rounded-lg p-3 mb-3 border border-border-subtle">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-tertiary">应付金额</span>
                      <span className="text-xl font-bold text-text-primary font-mono">RM {Number(finalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    📍 请携带现金到店支付。管理员确认收款后，将立即开始为您处理穿线服务。
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TNG 收据待审核提示 */}
        {hasPendingTngVerification && order.status === 'pending' && (
          <Card className="p-6 border-2 border-info/40 bg-ink-elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-info/15 rounded-full flex items-center justify-center text-2xl border border-info/30">
                  📱
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">收据待审核</h2>
                  <p className="text-sm text-text-secondary">
                    TnG 支付收据已上传
                  </p>
                </div>
              </div>
              <div className="bg-info text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                待审核
              </div>
            </div>
            <div className="bg-ink-surface rounded-lg p-4 border border-border-subtle">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-tertiary">支付金额</span>
                <span className="text-xl font-bold text-text-primary font-mono">RM {Number(finalAmount).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mt-4">
              ✅ 您的支付收据已成功提交！管理员将在 1-2 个工作日内审核，审核通过后订单将开始处理。
            </p>
          </Card>
        )}

        {/* 支付区域 */}
        {needsPayment && (
          <div id="payment-section">
            <>
              {showPayment ? (
                <OrderPaymentSection
                  orderId={order.id}
                  amount={finalAmount}
                  onPaymentSuccess={() => {
                    setShowPayment(false);
                    setToast({
                      show: true,
                      message: '收据已提交，等待管理员审核',
                      type: 'success',
                    });
                    // 使用静默刷新，避免页面闪烁
                    refreshOrderSilently();
                  }}
                  onCancel={() => setShowPayment(false)}
                />
              ) : (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">订单待支付</h2>
                      <p className="text-sm text-text-tertiary mt-1">
                        请完成支付以确认订单
                      </p>
                    </div>
                    <div className="bg-danger/15 text-danger text-xs font-medium px-3 py-1 rounded-full">
                      未支付
                    </div>
                  </div>

                  <div className="bg-ink-elevated border border-border-subtle rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-tertiary">应付金额</span>
                      <span className="text-2xl font-bold text-text-primary font-mono">
                        RM {Number(finalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowPayment(true)}
                    fullWidth
                    variant="primary"
                  >
                    立即支付
                  </Button>
                </Card>
              )}
            </>
          </div>
        )}
        {/* 收据卡 - 真实收据风格 */}
        <div className="relative">
          {/* 锯齿边缘效果 */}
          <div
            className="absolute top-0 left-0 right-0 h-3 bg-ink"
            style={{
              background: 'linear-gradient(135deg, var(--color-ink-surface) 25%, transparent 25%) -12px 0, linear-gradient(225deg, var(--color-ink-surface) 25%, transparent 25%) -12px 0, linear-gradient(315deg, var(--color-ink-surface) 25%, transparent 25%), linear-gradient(45deg, var(--color-ink-surface) 25%, transparent 25%)',
              backgroundSize: '24px 12px',
              backgroundPosition: '0 0',
            }}
          />

          <Card className="p-0 overflow-hidden mt-3 rounded-t-none border-t-0">
            {/* 收据头部 - 店铺信息 */}
            <div className="text-center py-4 border-b border-dashed border-border-subtle">
              <div className="text-2xl mb-1">🏸</div>
              <div className="font-bold text-text-primary">LW String Studio</div>
              <div className="text-xs text-text-tertiary">羽毛球穿线工作室</div>
            </div>

            {/* 订单号 */}
            <div className="flex items-center justify-between px-4 py-2 bg-ink-surface/50 border-b border-dashed border-border-subtle">
              <span className="text-xs text-text-tertiary">订单号</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-text-primary">#{generateShortCode(order.id)}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    setToast({ show: true, message: '订单号已复制', type: 'success' });
                  }}
                  className="text-xs text-accent hover:text-accent/80 px-1.5 py-0.5 rounded hover:bg-accent/10 transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
            {/* 价格明细 - 显示每种球线 */}
            <div className="px-4 py-3 space-y-2 font-mono text-sm border-b border-dashed border-border-subtle">
              {/* 多球拍订单：显示每种球线 */}
              {(order as any).items?.length > 0 ? (
                (order as any).items.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex items-end">
                    <span className="text-text-secondary truncate max-w-[60%]">
                      {item.string?.brand} {item.string?.model}
                    </span>
                    <span className="flex-1 border-b border-dotted border-border-subtle mx-2 mb-1" />
                    <span className="text-text-primary">RM {Number(item.price || 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                /* 单球拍订单 */
                <div className="flex items-end">
                  <span className="text-text-secondary">
                    {order.string?.brand} {order.string?.model}
                  </span>
                  <span className="flex-1 border-b border-dotted border-border-subtle mx-2 mb-1" />
                  <span className="text-text-primary">RM {Number(order.price).toFixed(2)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex items-end text-warning">
                  <span>🎁 优惠</span>
                  <span className="flex-1 border-b border-dotted border-warning/30 mx-2 mb-1" />
                  <span>- RM {Number(discountAmount).toFixed(2)}</span>
                </div>
              )}

              {order.use_package && (
                <div className="flex items-end text-success">
                  <span>🎁 套餐抵扣</span>
                  <span className="flex-1 border-b border-dotted border-success/30 mx-2 mb-1" />
                  <span className="text-xs">{packageName}</span>
                </div>
              )}

              {order.voucher_id && (
                <div className="flex items-end text-info">
                  <span>🎫 优惠券</span>
                  <span className="flex-1 border-b border-dotted border-info/30 mx-2 mb-1" />
                  <span className="text-xs">{order.voucher?.voucher?.name || '已用'}</span>
                </div>
              )}
            </div>

            {/* 合计 */}
            <div className="mx-4 border-t-2 border-double border-border-subtle pt-3 pb-2">
              <div className="flex justify-between items-center font-mono">
                <span className="font-bold text-text-primary">合计</span>
                <span className="text-2xl font-black text-accent">RM {finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* 支付信息 - 只有在实际选择了支付方式时才显示 */}
            {(() => {
              const payment = order.payment || order.payments?.[0];
              if (!payment) return null;

              const rawProvider = (payment as any).provider || (payment as any).payment_method || '';
              const providerKey = String(rawProvider).toLowerCase();

              // 只有当选择了真正的支付方式（cash 或 tng）时才显示，不显示 'pending' 等待选择状态
              if (!providerKey || providerKey === 'pending' || providerKey === 'manual') return null;

              const providerLabel = providerKey.includes('cash') ? '现金' : 'TnG';
              const providerIcon = providerKey.includes('cash') ? '💵' : '💳';

              const rawStatus = (payment as any).status || 'pending';
              const statusLabel =
                order.status === 'completed' || rawStatus === 'success' || rawStatus === 'completed' ? '已支付' :
                  rawStatus === 'pending_verification' ? '待审核' :
                    rawStatus === 'pending' ? '待确认' : '待支付';

              return (
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-sm bg-ink-surface/50 rounded px-3 py-2">
                    <span className="text-text-tertiary">支付方式</span>
                    <span className="text-text-primary font-medium">{providerIcon} {providerLabel} · {statusLabel}</span>
                  </div>
                </div>
              );
            })()}

            {/* 备注（如有） */}
            {order.notes && !order.notes.includes('快捷操作') && !order.notes.includes('管理员') && (
              <div className="mx-4 mb-3 px-3 py-2 bg-ink-surface/30 rounded text-sm">
                <span className="text-text-tertiary">📝 </span>
                <span className="text-text-secondary">{order.notes}</span>
              </div>
            )}

            {order.use_package && (
              <div className="px-4 pb-3">
                <p className="text-xs text-text-tertiary text-center">
                  套餐支付已覆盖本次服务
                </p>
              </div>
            )}

            {/* 底部 - 时间戳 */}
            <div className="border-t border-dashed border-border-subtle px-4 py-3 text-center">
              <div className="text-xs text-text-tertiary font-mono">
                {formatDate(createdAt, 'yyyy-MM-dd HH:mm:ss')}
              </div>
              {order.completed_at && (
                <div className="text-xs text-success mt-1">
                  ✓ 完成于 {formatDate(order.completed_at, 'yyyy-MM-dd HH:mm')}
                </div>
              )}
            </div>

            {/* 感谢语 */}
            <div className="text-center py-3 bg-ink-surface/30 border-t border-dashed border-border-subtle">
              <div className="text-sm text-text-secondary">感谢您的惠顾 🙏</div>
            </div>
          </Card>

          {/* 底部锯齿边缘 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{
              background: 'linear-gradient(135deg, transparent 75%, var(--color-ink-surface) 75%), linear-gradient(225deg, transparent 75%, var(--color-ink-surface) 75%), linear-gradient(315deg, transparent 75%, var(--color-ink-surface) 75%), linear-gradient(45deg, transparent 75%, var(--color-ink-surface) 75%)',
              backgroundSize: '24px 12px',
              backgroundPosition: '0 6px',
            }}
          />
        </div>

        {/* 订单照片（新系统） */}
        <OrderPhotosDisplay orderId={order.id} />

        {/* 订单评价区域 - 简化版（主入口在摘要卡） */}
        {order.status === 'completed' && (
          <>
            {review ? (
              /* 已有评价 - 显示评价内容 */
              <Card className="p-5">
                <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
                  ⭐ 我的评价
                </h2>
                <ReviewCard review={review} />
              </Card>
            ) : showReviewForm ? (
              /* 评价表单 */
              <div id="review-section">
                <ReviewForm
                  orderId={orderId}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            ) : (
              /* 简化的评价提示（主入口在顶部摘要卡） */
              <Card className="p-4 bg-ink-elevated border border-accent-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">分享您的体验</p>
                      <p className="text-xs text-text-tertiary">评价可获得 +10 积分</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowReviewForm(true)}
                    className="text-accent border-accent/30"
                  >
                    评价
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* 底部操作栏 */}
      {order.status === 'pending' && !hasPendingCashPayment && !hasPendingTngVerification && needsPayment && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 glass-surface border-t-2 border-border-subtle p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              className="flex-shrink-0"
            >
              ❌ 取消订单
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowPayment(true);
                // 自动滚动到支付区域
                setTimeout(() => {
                  document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              fullWidth
              className="bg-accent text-text-onAccent hover:shadow-glow"
            >
              💳 立即支付
            </Button>
          </div>
        </div>
      )}

      {order.status === 'pending' && hasPendingCashPayment && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 glass-surface border-t-2 border-warning/40 p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💵</span>
                <span className="font-semibold text-text-primary">现金支付待确认</span>
              </div>
              <span className="text-lg font-bold text-text-primary font-mono">RM {finalAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-text-secondary mb-3">请到店支付现金，管理员确认后开始处理</p>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
              className="bg-ink-surface hover:bg-ink-elevated"
            >
              ❌ 取消订单
            </Button>
          </div>
        </div>
      )}

      {order.status === 'pending' && hasPendingTngVerification && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 glass-surface border-t-2 border-info/40 p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <span className="font-semibold text-text-primary">TnG 收据待审核</span>
              </div>
              <span className="text-lg font-bold text-text-primary font-mono">RM {finalAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-text-secondary mb-3">收据已提交，请等待管理员审核（1-2个工作日）</p>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
              className="bg-ink-surface hover:bg-ink-elevated"
            >
              ❌ 取消订单
            </Button>
          </div>
        </div>
      )}

      {order.status === 'pending' && hasActualPendingPayment && !hasPendingCashPayment && !hasPendingTngVerification && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 glass-surface border-t-2 border-warning/40 p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                <span className="font-semibold text-text-primary">支付待确认</span>
              </div>
              <span className="text-lg font-bold text-text-primary font-mono">RM {finalAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-text-secondary mb-3">支付处理中，请等待确认</p>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
              className="bg-ink-surface hover:bg-ink-elevated"
            >
              ❌ 取消订单
            </Button>
          </div>
        </div>
      )}

      {order.status === 'pending' && !needsPayment && !hasActualPendingPayment && !hasPendingCashPayment && !hasPendingTngVerification && (
        <div className="fixed bottom-0 left-0 right-0 glass-surface border-t-2 border-border-subtle p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
            >
              ❌ 取消订单
            </Button>
          </div>
        </div>
      )}

      {/* 取消订单确认弹窗 */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="取消订单"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            确定要取消这个订单吗？取消后无法恢复。
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
              fullWidth
              disabled={cancelling}
            >
              返回
            </Button>
            <Button
              variant="primary"
              onClick={handleCancelOrder}
              fullWidth
              disabled={cancelling}
            >
              {cancelling ? '取消中...' : '确认取消'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast 提示 */}
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
