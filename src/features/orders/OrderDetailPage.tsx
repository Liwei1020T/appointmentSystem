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
import { formatDate } from '@/lib/utils';
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
  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReview();
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

  const finalAmount = order.final_price ?? order.price;
  const discountAmount = order.discount_amount ?? 0;

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
        {/* 订单状态 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">订单状态</h2>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <OrderTimeline
            currentStatus={order.status as any}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            completedAt={order.completed_at}
            cancelledAt={order.cancelled_at || undefined}
          />
        </Card>

        {/* 球线信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">球线信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">品牌</span>
              <span className="font-medium text-slate-900">{order.string?.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">型号</span>
              <span className="font-medium text-slate-900">{order.string?.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">规格</span>
              <span className="font-medium text-slate-900">{order.string?.specification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">拉力</span>
              <span className="font-medium text-slate-900">{order.tension} 磅</span>
            </div>
          </div>
        </Card>

        {/* 支付区域 */}
        {order.status === 'pending' &&
         order.payment_status === 'unpaid' &&
         finalAmount > 0 && (
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
                      RM {finalAmount.toFixed(2)}
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">价格明细</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">球线价格</span>
              <span className="font-medium text-slate-900">RM {order.price.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">优惠金额</span>
                <span className="font-medium text-orange-600">- RM {discountAmount.toFixed(2)}</span>
              </div>
            )}

            {order.use_package && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">使用套餐</span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                  套餐抵扣
                </span>
              </div>
            )}

            {order.voucher_id && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">使用优惠券</span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                  {order.voucher?.voucher?.name || '优惠券'}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="text-lg font-semibold text-slate-900">实付金额</span>
              <span className="text-lg font-bold text-blue-600">
                RM {finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* 支付信息 */}
        {order.payment && finalAmount > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">支付信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">支付状态</span>
                <span className={`font-medium ${
                  order.payment.status === 'completed' ? 'text-green-600' :
                  order.payment.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {order.payment.status === 'completed' ? '已支付' :
                   order.payment.status === 'pending' ? '待支付' :
                   '支付失败'}
                </span>
              </div>
              {order.payment.payment_method && (
                <div className="flex justify-between">
                  <span className="text-slate-600">支付方式</span>
                  <span className="font-medium text-slate-900">{order.payment.payment_method}</span>
                </div>
              )}
              {order.payment.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-slate-600">交易单号</span>
                  <span className="font-medium text-slate-900 text-sm">{order.payment.transaction_id}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 备注 */}
        {order.notes && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">订单备注</h2>
            <p className="text-slate-700">{order.notes}</p>
          </Card>
        )}

        {/* 订单信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">订单信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">订单编号</span>
              <span className="font-mono text-slate-900">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">下单时间</span>
              <span className="text-slate-900">{formatDate(order.created_at)}</span>
            </div>
            {order.updated_at && order.updated_at !== order.created_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">更新时间</span>
                <span className="text-slate-900">{formatDate(order.updated_at)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* 订单照片（新系统） */}
        <OrderPhotosDisplay orderId={order.id} />

        {/* 订单评价区域 */}
        {order.status === 'completed' && (
          <>
            {review ? (
              /* 已有评价 */
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">我的评价</h2>
                <ReviewCard review={review} />
              </div>
            ) : showReviewForm ? (
              /* 评价表单 */
              <ReviewForm
                orderId={orderId}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : canReview ? (
              /* 评价入口 */
              <Card className="p-6 text-center">
                <div className="text-slate-400 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  订单已完成，快来评价吧
                </h3>
                <p className="text-slate-600 mb-4">
                  分享您的体验，帮助我们做得更好，还能获得 10 积分奖励
                </p>
                <Button onClick={() => setShowReviewForm(true)}>
                  立即评价
                </Button>
              </Card>
            ) : null}
          </>
        )}
      </div>

      {/* 底部操作栏 */}
      {order.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-pb">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              fullWidth
            >
              取消订单
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
