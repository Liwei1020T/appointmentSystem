'use client';

/**
 * 管理员支付审核页面
 *
 * 功能：
 * - 展示待审核的支付记录（TNG 收据待审核 + 现金待确认）
 * - 支持订单支付 & 套餐支付
 * - 支持通过/拒绝，并触发后端创建 user_packages（套餐）或推进订单状态（订单）
 *
 * 数据来源：
 * - GET /api/admin/payments/pending
 *
 * 重要说明：
 * - 支付凭证 URL 存在 payments.metadata.receiptUrl / payments.metadata.proofUrl
 * - 这里使用 <img> 而不是 next/image，避免配置远程域名导致的显示问题
 */

import { useEffect, useMemo, useState } from 'react';
import { confirmCashPayment, confirmPayment, getPendingPayments, rejectPayment } from '@/services/paymentService';
import { formatAmount } from '@/lib/payment-helpers';
import { Badge, Button, Card, Modal, Toast } from '@/components';

interface PaymentUser {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
}

interface PaymentOrder {
  id: string;
  string: null | {
    brand: string;
    model: string;
  };
}

interface PaymentPackage {
  id: string;
  name: string;
  times: number;
  validityDays: number;
  price: number | string;
}

interface Payment {
  id: string;
  amount: number | string;
  status: string;
  provider: string;
  metadata?: any;
  createdAt: string | Date;
  user: PaymentUser;
  order: PaymentOrder | null;
  package: PaymentPackage | null;
}

function getProofUrl(payment: Payment): string | null {
  const meta = payment.metadata || {};
  return meta.receiptUrl || meta.proofUrl || null;
}

function getPaymentTitle(payment: Payment): string {
  if (payment.package) return `套餐购买：${payment.package.name}`;
  if (payment.order?.string)
    return `订单：${payment.order.string.brand} ${payment.order.string.model}`;
  if (payment.order) return `订单：${payment.order.id.slice(0, 8)}`;
  return '支付记录';
}

async function confirmPaymentByProvider(payment: Payment): Promise<void> {
  if (payment.provider === 'cash') {
    await confirmCashPayment(payment.id);
  } else {
    await confirmPayment(payment.id);
  }
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [processing, setProcessing] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const pendingCount = useMemo(() => payments.length, [payments.length]);
  const paymentSummary = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        if (payment.provider === 'cash') acc.cash += 1;
        if (payment.provider === 'tng') acc.tng += 1;
        if (getProofUrl(payment)) acc.withProof += 1;
        else acc.withoutProof += 1;
        return acc;
      },
      { cash: 0, tng: 0, withProof: 0, withoutProof: 0 }
    );
  }, [payments]);

  useEffect(() => {
    void fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPendingPayments(page, 10);
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('获取支付列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await confirmPaymentByProvider(selectedPayment);
      setToast({ message: '支付已确认', type: 'success' });
      await fetchPayments();
      setSelectedPayment(null);
      setShowConfirmModal(false);
    } catch (error: any) {
      setToast({ message: error.message || '确认失败', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      setToast({ message: '请输入拒绝原因', type: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      await rejectPayment(selectedPayment.id, rejectReason.trim());
      setToast({ message: '支付已拒绝', type: 'success' });
      await fetchPayments();
      setSelectedPayment(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error: any) {
      setToast({ message: error.message || '拒绝失败', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">支付审核</h1>
          <p className="mt-2 text-text-secondary">待审核支付：{pendingCount} 笔</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="warning" size="sm">待审核 {pendingCount}</Badge>
            <Badge variant="info" size="sm">TNG {paymentSummary.tng}</Badge>
            <Badge variant="neutral" size="sm">现金 {paymentSummary.cash}</Badge>
            <Badge variant="success" size="sm">有凭证 {paymentSummary.withProof}</Badge>
            <Badge variant="neutral" size="sm">无凭证 {paymentSummary.withoutProof}</Badge>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchPayments}>
          刷新列表
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-text-tertiary">暂无待审核的支付</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {payments.map((payment) => {
            const proofUrl = getProofUrl(payment);
            const title = getPaymentTitle(payment);
            const isCash = payment.provider === 'cash';

            return (
              <div
                key={payment.id}
                className="overflow-hidden rounded-xl bg-ink-surface shadow-sm transition-shadow hover:shadow-md border border-border-subtle"
              >
                {/* 支付凭证预览（现金不一定有） */}
                {proofUrl ? (
                  <div className="relative h-44 bg-ink-elevated">
                    <img
                      src={proofUrl}
                      alt="Payment Proof"
                      className="h-full w-full cursor-pointer object-contain"
                      onClick={() => setSelectedPayment(payment)}
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-ink-elevated text-sm text-text-tertiary">
                    {isCash ? '现金支付（无需收据）' : '未上传收据'}
                  </div>
                )}

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-text-primary">
                      {title}
                    </div>
                    <Badge variant="warning" size="sm">待审核</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isCash ? 'neutral' : 'info'} size="sm">
                      {isCash ? '现金' : 'TNG'}
                    </Badge>
                    <Badge variant={proofUrl ? 'success' : 'neutral'} size="sm">
                      {proofUrl ? '已上传凭证' : '无凭证'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary">支付金额</p>
                    <p className="text-2xl font-bold text-accent font-mono">
                      {formatAmount(Number(payment.amount))}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary">用户信息</p>
                    <p className="font-medium text-text-primary">
                      {payment.user.fullName || '用户'}
                    </p>
                    <p className="text-sm text-text-tertiary">{payment.user.phone || payment.user.email || '-'}</p>
                  </div>

                  <div className="text-xs text-text-tertiary">
                    提交时间：{new Date(payment.createdAt).toLocaleString('zh-CN')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-success text-text-primary hover:bg-success/90"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowConfirmModal(true);
                      }}
                      disabled={processing}
                    >
                      确认
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border-subtle bg-ink-surface px-4 py-2 text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-text-secondary">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border-subtle bg-ink-surface px-4 py-2 text-text-secondary hover:bg-ink-elevated disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      ) : null}


      {/* 确认收款模态框 */}
      <Modal
        isOpen={showConfirmModal && !!selectedPayment}
        onClose={() => {
          if (!processing) {
            setShowConfirmModal(false);
            setSelectedPayment(null);
          }
        }}
        title="💰 确认收款"
        className="!bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl"
      >
        {selectedPayment && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
              <p className="text-sm text-text-tertiary">确认收到以下款项吗？</p>
              <p className="text-4xl font-bold tracking-tight text-gradient font-mono">
                {formatAmount(Number(selectedPayment.amount))}
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-accent-soft/30 p-5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">支付方式</span>
                <Badge variant={selectedPayment.provider === 'cash' ? 'neutral' : 'info'} size="sm">
                  {selectedPayment.provider === 'cash' ? '现金' : 'TNG'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">订单编号</span>
                <span className="font-mono text-text-primary">{selectedPayment.order?.id.slice(0, 12) || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">业务类型</span>
                <span className="text-text-primary">{getPaymentTitle(selectedPayment).split('：')[0]}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-[2] h-12 text-lg shadow-glow"
                onClick={handleConfirm}
                loading={processing}
                disabled={processing}
                glow
              >
                确认收款
              </Button>
              <Button
                variant="ghost"
                className="flex-1 h-12 text-text-tertiary hover:text-text-primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPayment(null);
                }}
                disabled={processing}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 拒绝原因模态框 */}
      <Modal
        isOpen={showRejectModal && !!selectedPayment}
        onClose={() => {
          if (!processing) {
            setShowRejectModal(false);
            setRejectReason('');
          }
        }}
        title="⚠️ 拒绝支付"
        className="!bg-white/95 backdrop-blur-xl border border-danger/10 shadow-2xl"
      >
        {selectedPayment && (
          <div className="space-y-6 py-2">
            <div className="rounded-2xl border border-danger/10 bg-danger/5 p-5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">待处理支付</span>
                <span className="font-bold text-danger font-mono">{formatAmount(Number(selectedPayment.amount))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">内容摘要</span>
                <span className="text-text-primary text-right truncate max-w-[180px]">{getPaymentTitle(selectedPayment)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                填写拒绝原因
                <span className="text-xs font-normal text-text-tertiary">（用户将收到此反馈）</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：支付金额不符、凭证无法辨认等..."
                className="min-h-[140px] w-full rounded-xl border border-border-subtle bg-white p-4 text-text-primary placeholder:text-text-tertiary transition-all focus:ring-4 focus:ring-danger/5 focus:border-danger outline-none resize-none shadow-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-[2] h-12 text-lg shadow-md hover:shadow-lg transition-shadow"
                onClick={handleReject}
                loading={processing}
                disabled={processing || !rejectReason.trim()}
              >
                确认拒绝
              </Button>
              <Button
                variant="ghost"
                className="flex-1 h-12 text-text-tertiary hover:text-text-primary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={processing}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
