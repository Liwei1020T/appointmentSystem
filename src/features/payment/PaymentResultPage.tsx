/**
 * 支付结果页面 (Payment Result Page)
 * 
 * 显示支付成功/失败状态
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { getTNGPayment } from '@/services/tngPaymentService';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (paymentId) {
      checkPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    setLoading(true);

    try {
      const { payment: data, error } = await getTNGPayment(paymentId);

      if (error || !data) {
        setStatus('failed');
        setLoading(false);
        return;
      }

      setPayment(data);
      setStatus(data.status?.toLowerCase() as 'success' | 'failed' | 'pending');
      setLoading(false);
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setStatus('failed');
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-border-subtle bg-ink-surface text-center">
          <LoadingSpinner size="lg" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            正在确认支付状态...
          </h2>
          <p className="text-sm text-text-secondary">
            请稍候，不要关闭此页面
          </p>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-border-subtle bg-ink-surface text-center">
          {/* Success icon */}
          <div className="bg-success/15 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            支付成功！
          </h2>
          <p className="text-text-secondary mb-6">
            您的订单支付已完成
          </p>

          {/* Payment details */}
          {payment && (
            <div className="bg-ink-elevated rounded-lg p-4 mb-6 space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>订单编号</span>
                <span className="font-medium text-text-primary">{payment.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span>支付金额</span>
                <span className="font-medium text-text-primary">RM {Number(payment.amount).toFixed(2)}</span>
              </div>
              {payment.transaction_id && (
                <div className="flex justify-between">
                  <span>交易单号</span>
                  <span className="font-medium text-text-primary text-xs">{payment.transaction_id}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/orders/${payment?.order_id}`)}
              variant="primary"
              fullWidth
            >
              查看订单详情
            </Button>
            <Button
              onClick={() => router.push('/orders')}
              variant="secondary"
              fullWidth
            >
              <ArrowLeft className="w-4 h-4" />
              返回订单列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-border-subtle bg-ink-surface text-center">
          {/* Error icon */}
          <div className="bg-danger/15 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-danger" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            支付失败
          </h2>
          <p className="text-text-secondary mb-6">
            支付未能完成，请重试
          </p>

          {/* Payment details */}
          {payment && (
            <div className="bg-ink-elevated rounded-lg p-4 mb-6 space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>订单编号</span>
                <span className="font-medium text-text-primary">{payment.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span>应付金额</span>
                <span className="font-medium text-text-primary">RM {Number(payment.amount).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/orders/${payment?.order_id}`)}
              variant="primary"
              fullWidth
            >
              重新支付
            </Button>
            <Button
              onClick={() => router.push('/orders')}
              variant="secondary"
              fullWidth
            >
              <ArrowLeft className="w-4 h-4" />
              返回订单列表
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-text-tertiary mt-6">
            如有问题，请联系客服
          </p>
        </Card>
      </div>
    );
  }

  // Pending or unknown state
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <Card className="w-full max-w-md border border-border-subtle bg-ink-surface text-center">
        <div className="bg-warning/15 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-warning animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">
          支付处理中
        </h2>
        <p className="text-text-secondary mb-6">
          支付结果正在确认中，请稍候
        </p>

        <Button
          onClick={checkPaymentStatus}
          variant="primary"
          fullWidth
          className="mb-3"
        >
          刷新状态
        </Button>

        <Button
          onClick={() => router.push('/orders')}
          variant="secondary"
          fullWidth
        >
          <ArrowLeft className="w-4 h-4" />
          返回订单列表
        </Button>
      </Card>
    </div>
  );
}
