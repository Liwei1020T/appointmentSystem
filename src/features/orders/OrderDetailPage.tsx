/**
 * 订单详情页组件 (Order Detail Page)
 * 
 * 显示订单完整信息，包括球线详情、价格明细、支付信息、状态时间线等
 * 集成实时订阅功能，自动更新订单状态
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById, cancelOrder } from '@/services/order.service';
import { subscribeToOrderUpdates } from '@/services/realtimeService';
import { getOrderReview, canReviewOrder, OrderReview } from '@/services/review.service';
import {
  getOrderStatusNotification,
  showBrowserNotification,
  playNotificationSound,
  OrderStatus as OrderStatusType,
} from '@/lib/orderNotificationHelper';
import { Order } from '@/types';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import OrderStatusBadge, { OrderStatus } from '@/components/OrderStatusBadge';
import OrderTimeline from '@/components/OrderTimeline';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import OrderPhotosDisplay from '@/components/OrderPhotosDisplay';
import OrderPaymentSection from '@/components/OrderPaymentSection';
import { formatDate, generateShortCode } from '@/lib/utils';
import { useSession } from 'next-auth/react';

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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // 错误状态
  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Card className="p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-red-600 mb-4">{error || '订单不存在'}</p>
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
  const paymentRecord = order.payments?.[0];
  const paymentConfirmedAt = (paymentRecord as any)?.updated_at || (paymentRecord as any)?.paid_at || updatedAt;
  const paymentPendingAt = (paymentRecord as any)?.created_at || createdAt;
  const inProgressAt = (order as any).in_progress_at || updatedAt;
  const packageName = order.packageUsed?.package?.name || '配套服务';
  const packageRemainingCount = order.packageUsed?.remaining;
  const packageExpiry = order.packageUsed?.expiry ?? order.packageUsed?.expires_at;

  // 判断支付状态：检查是否有已完成的支付记录
  const hasCompletedPayment =
    order.payments?.some((p: any) => p.status === 'completed') || false;

  const hasPendingPayment =
    order.payments?.some((p: any) => p.status === 'pending') || false;
  
  const hasPendingCashPayment =
    order.payments?.some((p: any) => p.status === 'pending' && p.provider === 'cash') || false;

  // 只有现金支付待确认时才隐藏支付按钮，TNG待支付应该继续显示支付界面
  const needsPayment =
    order.status === 'pending' && !hasCompletedPayment && !hasPendingCashPayment && finalAmount > 0 && !order.use_package;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900">订单详情</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* 订单基本信息卡片 */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{order.string?.brand} {order.string?.model}</h2>
              <div className="text-xs text-slate-500 mt-1">
                下单时间: {formatDate(createdAt, 'yyyy/MM/dd HH:mm')}
              </div>
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
            paymentStatus={order.payments?.[0]?.status}
            usePackage={!!order.use_package}
            paymentConfirmedAt={paymentConfirmedAt as any}
            inProgressAt={inProgressAt as any}
            paymentPendingAt={paymentPendingAt as any}
          />
        </Card>

        {/* 球线信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">球线信息</h2>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎾</span>
              <div>
                <div className="font-semibold text-slate-900">{order.string?.brand} {order.string?.model}</div>
                <div className="text-xs text-slate-500">{order.string?.specification || '标准规格'}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">横线拉力</div>
              <div className="text-lg font-bold text-blue-900">{(order as any).tension_horizontal || order.tension} 磅</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">竖线拉力</div>
              <div className="text-lg font-bold text-blue-900">{(order as any).tension_vertical || order.tension} 磅</div>
            </div>
          </div>
          {((order as any).racket_brand || (order as any).racket_model) && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500 mb-1">球拍信息</div>
              <div className="text-sm text-slate-900">
                {(order as any).racket_brand} {(order as any).racket_model}
              </div>
            </div>
          )}
        </Card>

        {/* 现金支付待确认提示 - 仅在订单pending状态时显示 */}
        {hasPendingCashPayment && order.status === 'pending' && (
          <Card className="p-6 border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                  💵
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">现金支付待确认</h2>
                  <p className="text-sm text-gray-600">
                    请到店支付现金
                  </p>
                </div>
              </div>
              <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                待收款
              </div>
            </div>
            
            <div className="bg-white border-2 border-yellow-300 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    等待管理员确认收款
                  </p>
                  <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">应付金额</span>
                      <span className="text-xl font-bold text-yellow-900">RM {Number(finalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    📍 请携带现金到店支付。管理员确认收款后，将立即开始为您处理穿线服务。
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 支付区域 */}
        {needsPayment && (
          <>
            {showPayment ? (
              <OrderPaymentSection
                orderId={order.id}
                amount={finalAmount}
                onPaymentSuccess={() => {
                  setShowPayment(false);
                  setToast({
                    show: true,
                    message: '支付成功！订单已更新',
                    type: 'success',
                  });
                  loadOrder();
                }}
                onCancel={() => setShowPayment(false)}
              />
            ) : (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">订单待支付</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      请完成支付以确认订单
                    </p>
                  </div>
                  <div className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                    未支付
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-900">应付金额</span>
                    <span className="text-2xl font-bold text-blue-900">
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
        )}

        {/* 价格明细 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">💰 价格明细</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-slate-600">球线价格</span>
              <span className="font-semibold text-slate-900">RM {Number(order.price).toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-2 bg-orange-50 -mx-2 px-2 rounded">
                <span className="text-orange-700 flex items-center gap-1">
                  <span>🎁</span> 优惠金额
                </span>
                <span className="font-bold text-orange-600">- RM {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}

            {order.use_package && (
              <div className="space-y-2 py-3 px-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 flex items-center gap-1 font-semibold">
                    <span>🎁</span> 套餐支付
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">
                    套餐抵扣
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{packageName}</span>
                  {packageRemainingCount !== undefined ? (
                    <span className="text-xs text-slate-500">{packageRemainingCount} 次剩余</span>
                  ) : (
                    <span className="text-xs text-slate-500">剩余次数未知</span>
                  )}
                </div>
                {packageExpiry && (
                  <div className="text-xs text-slate-500">
                    有效期至 {formatDate(packageExpiry, 'yyyy-MM-dd')}
                  </div>
                )}
              </div>
            )}

            {order.voucher_id && (
              <div className="flex justify-between items-center py-2 bg-purple-50 -mx-2 px-2 rounded">
                <span className="text-purple-700 flex items-center gap-1">
                  <span>🎫</span> 使用优惠券
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-800">
                  {order.voucher?.voucher?.name || '优惠券'}
                </span>
              </div>
            )}

            <div className="pt-4 mt-2 border-t-2 border-slate-300 flex justify-between items-center bg-blue-50 -mx-2 px-2 py-3 rounded-lg">
              <span className="text-lg font-bold text-slate-900">实付金额</span>
              <span className="text-2xl font-black text-blue-600">
                RM {finalAmount.toFixed(2)}
              </span>
            </div>
            {order.use_package && (
              <p className="text-xs text-slate-500 mt-1">
                套餐支付已覆盖本次服务，无需额外支付。
              </p>
            )}
          </div>
        </Card>


        {/* 支付信息 */}
        {(order.payment || order.payments?.length) && finalAmount > 0 && (
          <Card className="p-6">
            {(() => {
              const payment = order.payment || order.payments?.[0];
              if (!payment) return null;

              const statusColors: Record<string, string> = {
                completed: 'bg-green-50 text-green-700 border-green-200',
                pending: 'bg-amber-50 text-amber-700 border-amber-200',
                pending_verification: 'bg-blue-50 text-blue-700 border-blue-200',
                failed: 'bg-red-50 text-red-700 border-red-200',
              };

              const statusLabels: Record<string, string> = {
                completed: '已支付',
                pending: '待支付',
                pending_verification: '待审核',
                failed: '支付失败',
              };

              const providerMap: Record<string, { label: string; icon: string }> = {
                cash: { label: '现金支付', icon: '💵' },
                tng: { label: "Touch 'n Go", icon: '💳' },
              };

              const rawProvider =
                (payment as any).provider ||
                (payment as any).payment_method ||
                (payment as any).method ||
                '';
              const providerKey = String(rawProvider).toLowerCase();
              const provider =
                providerKey.includes('cash')
                  ? providerMap.cash
                  : providerKey.includes('tng')
                  ? providerMap.tng
                  : providerMap.tng;

              const rawStatus =
                (payment as any).status ||
                (payment as any).payment_status ||
                (payment as any).paymentStatus ||
                'pending';
              const statusKey =
                order.status === 'completed' || rawStatus === 'success' || rawStatus === 'completed'
                  ? 'completed'
                  : rawStatus;
              const displayStatus = statusLabels[statusKey] || '待支付';
              const badge = statusColors[statusKey] || statusColors.pending;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {provider.icon} 支付信息
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge}`}>
                          {displayStatus}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">支付渠道：{provider.label}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">支付金额</div>
                      <div className="text-xl font-bold text-slate-900">
                        RM {Number(payment.amount ?? finalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">支付方式</div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2 mt-1">
                        <span>{provider.icon}</span>
                        <span>{provider.label}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">支付状态</div>
                      <div className="text-sm font-medium text-slate-900 mt-1">{displayStatus}</div>
                    </div>

                    {(payment as any).transaction_id && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 col-span-2">
                        <div className="text-xs text-slate-500">交易单号</div>
                        <div className="text-sm font-mono text-slate-900 mt-1 break-all">
                          {(payment as any).transaction_id}
                        </div>
                      </div>
                    )}

                    {(payment as any).created_at && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500">发起时间</div>
                        <div className="text-sm font-medium text-slate-900 mt-1">
                          {formatDate((payment as any).created_at, 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    )}

                    {(payment as any).updated_at && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500">最近更新</div>
                        <div className="text-sm font-medium text-slate-900 mt-1">
                          {formatDate((payment as any).updated_at, 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </Card>
        )}

        {/* 客户备注 */}
        {order.notes && !order.notes.includes('快捷操作') && !order.notes.includes('管理员') && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">订单备注</h2>
            <p className="text-slate-700">{order.notes}</p>
          </Card>
        )}

        {/* 订单信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">订单信息</h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">订单编号</div>
              <div className="font-mono font-semibold text-slate-900">#{generateShortCode(order.id)}</div>
              <div className="text-xs text-slate-400 mt-1 break-all">{order.id}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">📅 下单时间</div>
                <div className="text-slate-900 font-medium">{formatDate(createdAt, 'yyyy-MM-dd HH:mm')}</div>
              </div>
              {updatedAt && createdAt && updatedAt !== createdAt && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">🔄 更新时间</div>
                  <div className="text-slate-900 font-medium">{formatDate(updatedAt, 'yyyy-MM-dd HH:mm')}</div>
                </div>
              )}
              {order.completed_at && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">✅ 完成时间</div>
                  <div className="text-slate-900 font-medium">{formatDate(order.completed_at, 'yyyy-MM-dd HH:mm')}</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 订单照片（新系统） */}
        <OrderPhotosDisplay orderId={order.id} />

        {/* 订单评价区域 */}
        {order.status === 'completed' && (
          <>
            {review ? (
              /* 已有评价 */
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>⭐</span> 我的评价
                </h2>
                <ReviewCard review={review} />
              </Card>
            ) : showReviewForm ? (
              /* 评价表单 */
              <ReviewForm
                orderId={orderId}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : (
              /* 评价入口（完成即显示，避免 canReview 异常阻塞） */
              <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  订单已完成，快来评价吧！
                </h3>
                <p className="text-slate-600 mb-4">
                  分享您的体验，帮助我们做得更好
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 inline-block">
                  <p className="text-sm font-medium text-yellow-900">
                    🎁 评价奖励：<span className="text-lg font-bold">+10 积分</span>
                  </p>
                </div>
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  ✍️ 立即评价
                </Button>
              </Card>
            )}
          </>
        )}
      </div>

      {/* 底部操作栏 */}
      {order.status === 'pending' && !hasPendingCashPayment && needsPayment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 shadow-lg safe-area-pb">
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
              onClick={() => setShowPayment(true)}
              fullWidth
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              💳 立即支付
            </Button>
          </div>
        </div>
      )}
      
      {order.status === 'pending' && hasPendingCashPayment && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-100 to-orange-100 border-t-2 border-yellow-300 p-4 shadow-lg safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💵</span>
                <span className="font-semibold text-gray-900">现金支付待确认</span>
              </div>
              <span className="text-lg font-bold text-yellow-900">RM {finalAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">请到店支付现金，管理员确认后开始处理</p>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
              className="bg-white hover:bg-gray-50"
            >
              ❌ 取消订单
            </Button>
          </div>
        </div>
      )}
      
      {order.status === 'pending' && !needsPayment && !hasPendingCashPayment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 shadow-lg safe-area-pb">
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
          <p className="text-slate-700">
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
