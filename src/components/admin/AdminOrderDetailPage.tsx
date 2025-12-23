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
import { Badge, Button, Card } from '@/components';
import OrderPhotosUploader from '@/components/admin/OrderPhotosUploader';
import OrderPhotosUpload from '@/components/OrderPhotosUpload';
import PaymentReceiptVerifier from '@/components/admin/PaymentReceiptVerifier';
import AdminOrderProgress from '@/components/admin/AdminOrderProgress';
import { confirmCashPayment, confirmPayment, verifyPaymentReceipt } from '@/services/paymentService';
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
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null); // Photo preview modal
  /**
   * 支付信息来源兼容：
   * - 新：`order.payment`（单条）
   * - 旧：`order.payments`（多条，需选取最相关的一条）
   *
   * 说明：
   * - 之前直接取 `payments[0]` 会导致展示到旧记录/非当前记录，进而出现“支付方式 -”等信息缺失。
   */
  const payment = (() => {
    const direct = (order as any)?.payment;
    if (direct) return direct;

    const payments = ((order as any)?.payments ?? []) as any[];
    if (!Array.isArray(payments) || payments.length === 0) return null;

    // 优先：排除 failed；按 createdAt/created_at/updatedAt/updated_at 倒序选择最新
    const ranked = payments
      .filter((p) => p && p.status !== 'failed')
      .sort((a, b) => {
        const aTime =
          new Date(a.updatedAt ?? a.updated_at ?? a.createdAt ?? a.created_at ?? 0).getTime() || 0;
        const bTime =
          new Date(b.updatedAt ?? b.updated_at ?? b.createdAt ?? b.created_at ?? 0).getTime() || 0;
        return bTime - aTime;
      });

    return ranked[0] ?? payments[0];
  })();

  /**
   * Normalize payment “confirmed/paid” state across:
   * - New prisma: payments.status = 'success' (confirmed)
   * - Legacy/other flows: payment_status/status = 'completed'
   */
  const isPaymentConfirmed = (() => {
    if (!payment) return false;
    const candidates = [payment.status, payment.payment_status].filter(Boolean).map((s: string) => String(s).toLowerCase());
    return candidates.some((s: string) => ['success', 'completed', 'paid'].includes(s));
  })();

  // 调试日志移除
  useEffect(() => { }, [order, payment]);

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

  const getStatusVariant = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      in_progress: 'info',
      ready: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return variants[status] || 'neutral';
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
      <div className="min-h-screen flex items-center justify-center bg-ink-elevated">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-ink-elevated p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-danger/15 border border-danger/40 rounded-lg p-6 text-center">
            <p className="text-danger mb-4">{error || '订单不存在'}</p>
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-4 py-2 bg-danger text-text-primary rounded-lg hover:bg-danger/90 transition-colors"
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
    <div className="min-h-screen bg-ink-elevated">
      {/* Header */}
      <div className="glass-strong border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/orders')}
              >
                ← 返回订单列表
              </Button>
              <div className="mt-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">订单详情</h1>
                <Badge variant={getStatusVariant(order.status)} size="sm" className="px-3 py-1.5">
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <p className="text-xs text-text-tertiary mt-1 font-mono">#{order.id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* “更多状态”改为“已完成”快捷按钮：直接走完成订单流程（库存/利润/积分） */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <Button
                  size="sm"
                  onClick={() => setShowCompleteModal(true)}
                >
                  已完成
                </Button>
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
            {/* Order Info - 支持多球拍订单 */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                {(order as any).items?.length > 0
                  ? `订单信息 (${(order as any).items.length} 支球拍)`
                  : '订单信息'
                }
              </h2>

              {/* 多球拍订单 */}
              {(order as any).items?.length > 0 ? (
                <div className="space-y-4">
                  {(order as any).items.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className="bg-ink-elevated rounded-lg p-4 border border-border-subtle"
                    >
                      <div className="flex gap-4">
                        {/* 球拍照片 */}
                        {(item.racketPhoto || item.racket_photo) && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.racketPhoto || item.racket_photo}
                              alt={`球拍 ${index + 1}`}
                              className="w-24 h-24 rounded-lg object-cover border border-border-subtle cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setPreviewPhoto(item.racketPhoto || item.racket_photo)}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {/* 球拍序号和球线信息 */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 bg-accent text-white rounded-full text-sm font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-semibold text-text-primary">
                                  {item.string?.brand} {item.string?.model}
                                </div>
                                {(item.racketBrand || item.racket_brand || item.racketModel || item.racket_model) && (
                                  <div className="text-xs text-text-tertiary">
                                    球拍: {item.racketBrand || item.racket_brand} {item.racketModel || item.racket_model}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-accent font-mono">
                                RM {Number(item.price || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          {/* 磅数 */}
                          <div className="flex gap-4 mt-2">
                            <div className="bg-ink-surface rounded px-3 py-1.5 border border-border-subtle">
                              <span className="text-xs text-text-tertiary">竖线 </span>
                              <span className="font-bold text-text-primary">
                                {item.tensionVertical || item.tension_vertical} lbs
                              </span>
                            </div>
                            <div className="bg-ink-surface rounded px-3 py-1.5 border border-border-subtle">
                              <span className="text-xs text-text-tertiary">横线 </span>
                              <span className="font-bold text-text-primary">
                                {item.tensionHorizontal || item.tension_horizontal} lbs
                              </span>
                            </div>
                          </div>
                          {/* 备注 */}
                          {item.notes && (
                            <div className="mt-2 text-xs text-text-tertiary">
                              📝 {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 总价 */}
                  <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                    <span className="text-text-secondary">总计</span>
                    <span className="text-lg font-bold text-accent font-mono">
                      {(() => {
                        const total = (order as any).items.reduce((sum: number, item: any) =>
                          sum + Number(item.price || 0), 0
                        );
                        return `RM ${total.toFixed(2)}`;
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                /* 单球拍订单（旧格式兼容） */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">球线型号</div>
                    <div className="font-medium text-text-primary">
                      {order.string?.model || order.string?.name || order.stringInventory?.model || '-'}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {order.string?.brand || order.stringInventory?.brand || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary mb-1">价格</div>
                    <div className="font-medium text-text-primary font-mono">
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
                    <div className="text-sm text-text-secondary mb-1">竖线拉力</div>
                    <div className="font-medium text-text-primary">
                      {(() => {
                        // 尝试从备注解析分拉信息 [竖/横分拉: 24/26 LBS]
                        const match = order.notes?.match(/\[竖\/横分拉:\s*(\d+)\/(\d+)\s*LBS\]/);
                        if (match) return `${match[1]} lbs`;

                        const v = (order as any).tension_vertical ?? (order as any).tension ?? order.tension;
                        return v ? `${v} lbs` : '-';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary mb-1">横线拉力</div>
                    <div className="font-medium text-text-primary">
                      {(() => {
                        const match = order.notes?.match(/\[竖\/横分拉:\s*(\d+)\/(\d+)\s*LBS\]/);
                        if (match) return `${match[2]} lbs`;

                        const h = (order as any).tension_horizontal ?? (order as any).tension ?? order.tension;
                        return h ? `${h} lbs` : '-';
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <div className="text-sm text-text-secondary mb-1">客户备注</div>
                  <div className="text-text-primary bg-ink-elevated p-3 rounded-lg">{order.notes}</div>
                </div>
              )}
            </Card>

            {/* Payment Info */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">支付信息</h2>
                {/* 退款功能已移除 */}
              </div>
              {payment ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">支付方式</span>
                    <span className="font-medium text-text-primary">
                      {payment.provider === 'cash'
                        ? '💵 现金支付'
                        : payment.provider === 'tng'
                          ? '💳 TNG'
                          : payment.payment_method || payment.method || payment.provider || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">支付状态</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={isPaymentConfirmed ? 'success' : 'warning'} size="sm">
                        {isPaymentConfirmed ? '已支付' : '待确认'}
                      </Badge>
                      {/* 现金支付待确认时显示提示 */}
                      {payment.provider === 'cash' && !isPaymentConfirmed && payment.status === 'pending' && (
                        <span className="text-xs text-warning">现金待收款</span>
                      )}
                    </div>
                  </div>
                  {payment.amount && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">支付金额</span>
                      <span className="font-medium text-text-primary font-mono">
                        RM {Number(payment.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-border-subtle">
                    <span className="text-text-secondary">球线价格</span>
                    <span className="font-medium text-text-primary font-mono">
                      RM {(() => {
                        const price = order.string?.price ?? (order as any).price ?? (order as any).final_price ?? 0;
                        return Number(price).toFixed(2);
                      })()}
                    </span>
                  </div>
                  {(order.voucher_discount ?? 0) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>优惠券折扣</span>
                      <span className="font-mono">-RM {Number(order.voucher_discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-border-subtle">
                    <span className="text-lg font-semibold text-text-primary">订单总额</span>
                    <span className="text-lg font-bold text-accent font-mono">
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
                <p className="text-text-tertiary">暂无支付信息</p>
              )}
            </Card>

            {/* Payment Receipt Verification */}
            {payment && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-text-primary mb-4">支付收据审核</h2>
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
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">客户信息</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-text-secondary mb-1">姓名</div>
                  <div className="font-medium text-text-primary">{order.user?.full_name || order.user?.fullName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary mb-1">联系方式</div>
                  <div className="text-text-primary">{order.user?.phone || order.user?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary mb-1">电话</div>
                  <div className="font-medium text-text-primary">{order.user?.phone || '-'}</div>
                </div>
              </div>
            </Card>

            {/* Progress Management */}
            <AdminOrderProgress
              orderId={order.id}
              currentStatus={order.status as any}
              createdAt={String((order as any).createdAt || order.created_at || '')}
              updatedAt={(order as any).updatedAt || (order as any).updated_at ? String((order as any).updatedAt || (order as any).updated_at) : undefined}
              completedAt={(order as any).completedAt || (order as any).completed_at ? String((order as any).completedAt || (order as any).completed_at) : undefined}
              cancelledAt={(order as any).cancelledAt || (order as any).cancelled_at ? String((order as any).cancelledAt || (order as any).cancelled_at) : undefined}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-ink-surface rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-4">更新订单状态</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">新状态</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {nextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">备注（可选）</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-secondary bg-ink-elevated hover:bg-ink-surface transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-onAccent bg-accent hover:shadow-glow transition-colors disabled:opacity-50"
              >
                {updating ? '更新中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-ink-surface rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">完成订单</h3>
              <p className="text-sm text-text-secondary mt-2">
                完成订单将自动执行以下操作：
              </p>
            </div>

            <div className="bg-info-soft rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-info mt-0.5">✓</span>
                <span className="text-text-primary">计算并记录利润</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-info mt-0.5">✓</span>
                <span className="text-text-primary">发放积分给用户 (订单金额 × 10%)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-info mt-0.5">✓</span>
                <span className="text-text-primary">发送完成通知</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">备注（可选）</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-secondary bg-ink-elevated hover:bg-ink-surface transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleCompleteOrder}
                disabled={completing}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-primary bg-success hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
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

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors text-xl font-bold"
            >
              ✕ 关闭
            </button>
            <img
              src={previewPhoto}
              alt="球拍照片预览"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
