/**
 * 支付结果页面 (Payment Result Page)
 * 
 * 显示支付成功/失败状态
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            正在确认支付状态...
          </h2>
          <p className="text-sm text-gray-500">
            请稍候，不要关闭此页面
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {/* Success icon */}
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            支付成功！
          </h2>
          <p className="text-gray-600 mb-6">
            您的订单支付已完成
          </p>

          {/* Payment details */}
          {payment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">订单编号</span>
                <span className="font-medium text-gray-900">{payment.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支付金额</span>
                <span className="font-medium text-gray-900">RM {Number(payment.amount).toFixed(2)}</span>
              </div>
              {payment.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">交易单号</span>
                  <span className="font-medium text-gray-900 text-xs">{payment.transaction_id}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/orders/${payment?.order_id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors"
            >
              查看订单详情
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回订单列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {/* Error icon */}
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            支付失败
          </h2>
          <p className="text-gray-600 mb-6">
            支付未能完成，请重试
          </p>

          {/* Payment details */}
          {payment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">订单编号</span>
                <span className="font-medium text-gray-900">{payment.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">应付金额</span>
                <span className="font-medium text-gray-900">RM {Number(payment.amount).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/orders/${payment?.order_id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors"
            >
              重新支付
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回订单列表
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-6">
            如有问题，请联系客服
          </p>
        </div>
      </div>
    );
  }

  // Pending or unknown state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏳</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          支付处理中
        </h2>
        <p className="text-gray-600 mb-6">
          支付结果正在确认中，请稍候
        </p>

        <button
          onClick={checkPaymentStatus}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors mb-3"
        >
          刷新状态
        </button>

        <button
          onClick={() => router.push('/orders')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-6 py-3 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回订单列表
        </button>
      </div>
    </div>
  );
}
