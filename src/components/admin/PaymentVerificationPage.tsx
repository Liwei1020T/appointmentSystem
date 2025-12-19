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
import { getPendingPayments, rejectPayment } from '@/services/payment.service';
import { formatAmount } from '@/lib/payment-helpers';

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
  const endpoint =
    payment.provider === 'cash'
      ? `/api/admin/payments/${payment.id}/confirm-cash`
      : `/api/admin/payments/${payment.id}/confirm`;

  const response =
    payment.provider === 'cash'
      ? await fetch(endpoint, { method: 'POST' })
      : await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || '确认支付失败');
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

  const pendingCount = useMemo(() => payments.length, [payments.length]);

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

  const handleConfirm = async (payment: Payment) => {
    const amountText = formatAmount(Number(payment.amount));
    if (!confirm(`确认收款 ${amountText}？\n${getPaymentTitle(payment)}`)) return;

    setProcessing(true);
    try {
      await confirmPaymentByProvider(payment);
      alert('支付已确认');
      await fetchPayments();
      setSelectedPayment(null);
    } catch (error: any) {
      alert(error.message || '确认失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      await rejectPayment(selectedPayment.id, rejectReason.trim());
      alert('支付已拒绝');
      await fetchPayments();
      setSelectedPayment(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error: any) {
      alert(error.message || '拒绝失败');
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">支付审核</h1>
        <p className="mt-2 text-text-secondary">待审核支付：{pendingCount} 笔</p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-lg bg-ink-surface p-12 text-center shadow">
          <p className="text-text-tertiary">暂无待审核的支付</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {payments.map((payment) => {
            const proofUrl = getProofUrl(payment);
            const title = getPaymentTitle(payment);
            const isCash = payment.provider === 'cash';

            return (
              <div
                key={payment.id}
                className="overflow-hidden rounded-lg bg-ink-surface shadow-lg transition-shadow hover:shadow-xl border border-border-subtle"
              >
                {/* 支付凭证预览（现金不一定有） */}
                {proofUrl ? (
                  <div className="relative h-48 bg-ink-elevated">
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
                  <div className="text-sm font-semibold text-text-primary">
                    {title}
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary">支付金额</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatAmount(Number(payment.amount))}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary">用户信息</p>
                    <p className="font-medium text-text-primary">
                      {payment.user.fullName || '用户'}
                    </p>
                    <p className="text-sm text-text-tertiary">{payment.user.phone || payment.user.email || '-'}</p>
                    {payment.user.phone ? (
                      <p className="text-sm text-text-tertiary">{payment.user.phone}</p>
                    ) : null}
                  </div>

                  <div className="text-xs text-text-tertiary">
                    提交时间：{new Date(payment.createdAt).toLocaleString('zh-CN')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleConfirm(payment)}
                      disabled={processing}
                      className="flex-1 rounded-lg bg-success px-4 py-2 text-text-primary hover:bg-success/90 disabled:opacity-50"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                      className="flex-1 rounded-lg bg-danger px-4 py-2 text-text-primary hover:bg-danger/90 disabled:opacity-50"
                    >
                      拒绝
                    </button>
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

      {/* 凭证预览模态框 */}
      {selectedPayment && !showRejectModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-ink-surface border border-border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-text-primary">支付详情</h2>

              {getProofUrl(selectedPayment) ? (
                <div className="mb-6">
                  <img
                    src={getProofUrl(selectedPayment) as string}
                    alt="Payment Proof"
                    className="h-auto w-full rounded-lg object-contain"
                  />
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">支付金额</p>
                    <p className="text-xl font-bold text-text-primary">
                      {formatAmount(Number(selectedPayment.amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">支付方式</p>
                    <p className="font-medium text-text-primary">
                      {selectedPayment.provider === 'cash' ? '现金' : 'TNG'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">用户</p>
                    <p className="font-medium text-text-primary">
                      {selectedPayment.user.fullName || '用户'}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {selectedPayment.user.phone || selectedPayment.user.email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">内容</p>
                    <p className="text-sm text-text-primary">{getPaymentTitle(selectedPayment)}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleConfirm(selectedPayment)}
                    disabled={processing}
                    className="flex-1 rounded-lg bg-success px-6 py-3 text-text-primary hover:bg-success/90 disabled:opacity-50"
                  >
                    确认支付
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="flex-1 rounded-lg bg-danger px-6 py-3 text-text-primary hover:bg-danger/90 disabled:opacity-50"
                  >
                    拒绝支付
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="rounded-lg bg-ink-elevated px-6 py-3 text-text-secondary hover:bg-ink-surface"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 拒绝原因模态框 */}
      {showRejectModal && selectedPayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
          <div className="w-full max-w-md rounded-lg bg-ink-surface p-6 border border-border-subtle">
            <h2 className="mb-4 text-xl font-bold text-text-primary">拒绝支付</h2>
            <p className="mb-4 text-text-secondary">请输入拒绝原因，用户将收到通知</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如：支付金额不符、凭证不清晰等"
              className="mb-4 min-h-[100px] w-full rounded-lg border border-border-subtle bg-ink-elevated p-3 text-text-primary focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 rounded-lg bg-danger px-4 py-2 text-text-primary hover:bg-danger/90 disabled:opacity-50"
              >
                确认拒绝
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 rounded-lg bg-ink-elevated px-4 py-2 text-text-secondary hover:bg-ink-surface"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
