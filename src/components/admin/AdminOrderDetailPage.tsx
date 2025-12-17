/**
 * 管理员订单详情页面组件 (Admin Order Detail Page)
 * 
 * 功能：
 * - 订单完整信息展示
 * - 客户信息
 * - 球线详情
 * - 支付信息
 * - 状态时间线
 * - 更新订单状态
 * - 备注管理
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getOrderById, updateOrderStatus, updateOrderPhotos } from '@/services/adminOrderService';
import type { AdminOrder, OrderStatus } from '@/services/adminOrderService';
import OrderPhotosUploader from '@/components/admin/OrderPhotosUploader';
import OrderPhotosUpload from '@/components/OrderPhotosUpload';
import PaymentReceiptVerifier from '@/components/admin/PaymentReceiptVerifier';
import AdminOrderProgress from '@/components/admin/AdminOrderProgress';
import { verifyPaymentReceipt } from '@/services/paymentService';
import { completeOrder } from '@/services/completeOrderService';
import { toast } from 'sonner';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [adminNotes, setAdminNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  // 支持从 payment 或 payments 数组中获取支付信息
  const payment = order?.payment || (order as any)?.payments?.[0];

  // 调试日志移除
  useEffect(() => {}, [order, payment]);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);

    const { order: fetchedOrder, error: orderError } = await getOrderById(orderId);

    if (orderError) {
      setError(orderError.message);
    } else {
      setOrder(fetchedOrder);
    }

    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!order) return;

    setUpdating(true);
    const { order: updatedOrder, error: updateError } = await updateOrderStatus(
      orderId,
      newStatus,
      adminNotes
    );

    if (updateError) {
      setError(updateError.message);
      toast.error('更新状态失败');
    } else {
      setOrder(updatedOrder);
      setShowStatusModal(false);
      setAdminNotes('');
      toast.success('订单状态已更新');
    }

    setUpdating(false);
  };

  // 完成订单处理函数
  const handleCompleteOrder = async () => {
    if (!order) return;

    setCompleting(true);
    
    try {
      const { data, error: completeError } = await completeOrder(orderId, adminNotes);

      if (completeError) {
        toast.error(completeError);
        setError(completeError);
      } else if (data) {
        toast.success(
          `订单已完成！\n✓ 扣减库存: ${data.stock_deducted}m\n✓ 利润: RM${data.profit.toFixed(2)}\n✓ 积分奖励: ${data.points_granted}`
        );
        setShowCompleteModal(false);
        setAdminNotes('');
        // 重新加载订单数据
        await loadOrder();
      }
    } catch (err: any) {
      toast.error(err.message || '完成订单失败');
    } finally {
      setCompleting(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
      ready: 'bg-teal-100 text-teal-700 border-teal-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status];
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: '待确认',
      confirmed: '已确认',
      processing: '处理中',
      in_progress: '处理中',
      ready: '已完成',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      processing: ['completed', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error || '订单不存在'}</p>
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              返回订单列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextStatuses = getNextStatus(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/admin/orders')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
              >
                ← 返回订单列表
              </button>
              <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
              <p className="text-sm text-gray-600 mt-1 font-mono">#{order.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusBadge(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>

              {/* 确认收款按钮 - 支持现金/TNG/其他待确认支付 */}
              {payment && ['pending', 'pending_verification'].includes(payment.status) && (
                <button
                  onClick={async () => {
                    setUpdating(true);
                    try {
                      const isCash = payment.provider === 'cash';
                      const url = isCash
                        ? `/api/admin/payments/${payment.id}/confirm-cash`
                        : `/api/admin/payments/${payment.id}/confirm`;
                      const res = await fetch(url, {
                        method: 'POST',
                        headers: isCash ? undefined : { 'Content-Type': 'application/json' },
                        body: isCash ? undefined : JSON.stringify({}),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || data?.success === false) {
                        throw new Error(data?.error || '确认收款失败');
                      }
                      toast.success(isCash ? '现金收款已确认' : '支付已确认');
                      await loadOrder();
                    } catch (error: any) {
                      toast.error(error?.message || '确认收款失败');
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>✅</span>
                  {updating ? '处理中...' : '确认收款'}
                </button>
              )}

              {/* 确认TNG付款按钮 - 仅TNG支付需要单独确认 */}
              {payment && payment.status === 'pending' && payment.provider === 'tng' && payment.receipt_url && (
                <button
                  onClick={async () => {
                    if (confirm('确认TNG支付收据有效？')) {
                      try {
                        const { error } = await verifyPaymentReceipt(payment.id, true, '管理员快速审核通过');
                        if (error) {
                          toast.error(String(error));
                        } else {
                          toast.success('💳 TNG支付已确认');
                          loadOrder();
                        }
                      } catch (error) {
                        toast.error('确认失败');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <span>💳</span>
                  确认TNG收款
                </button>
              )}
              
              {/* 现金支付提示标签 */}
              {payment && payment.status === 'pending' && payment.provider === 'cash' && (
                <span className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                  💵 现金待收款
                </span>
              )}
              
              {/* 完成订单按钮 (仅当状态为 in_progress 时显示) */}
              {order.status === 'in_progress' && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <span>✓</span>
                  完成订单
                </button>
              )}
              
              {nextStatuses.length > 0 && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  更多状态
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">订单信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">球线型号</div>
                  <div className="font-medium text-gray-900">
                    {order.string?.model || order.string?.name || order.stringInventory?.model || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.string?.brand || order.stringInventory?.brand || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">价格</div>
                  <div className="font-medium text-gray-900">
                    {(() => {
                      const price = Number(
                        order.total_price ??
                          order.totalAmount ??
                          (order as any).price ??
                          order.string?.price ??
                          0
                      );
                      return `RM ${price.toFixed(2)}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">横线拉力</div>
                  <div className="font-medium text-gray-900">
                    {(() => {
                      const h = (order as any).tension_horizontal ?? (order as any).tension ?? order.tension;
                      return h ? `${h} lbs` : '-';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">竖线拉力</div>
                  <div className="font-medium text-gray-900">
                    {(() => {
                      const v = (order as any).tension_vertical ?? (order as any).tension ?? order.tension;
                      return v ? `${v} lbs` : '-';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">球拍品牌</div>
                  <div className="font-medium text-gray-900">{order.racket_brand}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">球拍型号</div>
                  <div className="font-medium text-gray-900">{order.racket_model}</div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">客户备注</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{order.notes}</div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">支付信息</h2>
                {/* 退款功能已移除 */}
              </div>
              {payment ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">支付方式</span>
                    <span className="font-medium text-gray-900">
                      {payment.provider === 'cash' ? '💵 现金支付' : 
                       payment.provider === 'tng' ? '💳 TNG' : 
                       payment.payment_method || payment.method || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">支付状态</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.payment_status === 'completed' || payment.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {payment.payment_status === 'completed' || payment.status === 'completed' ? '已支付' : '待确认'}
                      </span>
                      {/* 现金支付待确认时显示提示 */}
                      {payment.provider === 'cash' && payment.status === 'pending' && (
                        <span className="text-xs text-yellow-600">
                          点击"确认收款并开始穿线"确认
                        </span>
                      )}
                    </div>
                  </div>
                  {payment.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">支付金额</span>
                      <span className="font-medium text-gray-900">
                        RM {Number(payment.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-600">球线价格</span>
                    <span className="font-medium text-gray-900">
                      RM {(() => {
                        const price = order.string?.price ?? (order as any).price ?? (order as any).final_price ?? 0;
                        return Number(price).toFixed(2);
                      })()}
                    </span>
                  </div>
                  {(order.voucher_discount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>优惠券折扣</span>
                      <span>-RM {Number(order.voucher_discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">订单总额</span>
                    <span className="text-lg font-bold text-purple-600">
                      RM {(() => {
                        const totalAmount = Number(
                          order.total_price ??
                            order.totalAmount ??
                            (order as any).final_price ??
                            payment?.amount ??
                            0
                        );
                        return totalAmount.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">暂无支付信息</p>
              )}
            </div>

            {/* Payment Receipt Verification */}
            {payment && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">支付收据审核</h2>
                <PaymentReceiptVerifier
                  receiptUrl={payment.receipt_url || ''}
                  paymentStatus={payment.payment_status || payment.status || 'pending'}
                  paymentId={payment.id}
                  verifiedAt={(payment.metadata as any)?.verifiedAt || null}
                  adminNotes={(payment.metadata as any)?.adminNotes || ''}
                  onVerify={async (approved, notes) => {
                    const { error } = await verifyPaymentReceipt(
                      payment.id,
                      approved,
                      notes
                    );
                    if (error) {
                      throw new Error(String(error));
                    }
                    await loadOrder();
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">客户信息</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">姓名</div>
                  <div className="font-medium text-gray-900">{order.user?.full_name || order.user?.fullName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">邮箱</div>
                  <div className="text-gray-900">{order.user?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">电话</div>
                  <div className="font-medium text-gray-900">{order.user?.phone || '-'}</div>
                </div>
              </div>
            </div>

            {/* Progress Management */}
            <AdminOrderProgress
              orderId={order.id}
              currentStatus={order.status as any}
              createdAt={String(order.created_at || order.createdAt || '')}
              updatedAt={order.updated_at ? String(order.updated_at) : undefined}
              completedAt={order.completed_at ? String(order.completed_at) : undefined}
              cancelledAt={(order as any).cancelled_at ? String((order as any).cancelled_at) : undefined}
              onStatusUpdate={loadOrder}
            />

            {/* Order Photos (新系统) */}
            <OrderPhotosUpload
              orderId={order.id}
              onUploadSuccess={() => {
                toast.success('照片上传成功');
                loadOrder();
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新订单状态</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新状态</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {updating ? '更新中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">完成订单</h3>
              <p className="text-sm text-gray-600 mt-2">
                完成订单将自动执行以下操作：
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-blue-900">扣减球线库存 (11米)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-blue-900">计算并记录利润</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-blue-900">发放积分给用户 (订单金额 × 10%)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span className="text-blue-900">发送完成通知</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="添加完成备注..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setAdminNotes('');
                }}
                disabled={completing}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleCompleteOrder}
                disabled={completing}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    确认完成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
