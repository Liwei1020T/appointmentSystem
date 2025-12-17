/**
 * 订单支付页面组件 (Order Payment Page Component)
 * 
 * 手动支付流程：
 * 1. 显示 TNG 收款码
 * 2. 用户扫码支付
 * 3. 用户上传支付收据
 * 4. 管理员审核收据
 */

'use client';

import { useState, useEffect } from 'react';
import { CreditCard, X } from 'lucide-react';
import TngQRCodeDisplay from '@/components/TngQRCodeDisplay';
import PaymentReceiptUploader from '@/components/PaymentReceiptUploader';
import { createPayment, uploadPaymentReceipt } from '@/services/paymentService';
import { toast } from 'sonner';

interface OrderPaymentSectionProps {
  orderId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentId?: string;
  existingReceipt?: string;
  paymentStatus?: string;
  onPaymentSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrderPaymentSection({
  orderId,
  amount,
  paymentId: existingPaymentId,
  existingReceipt,
  paymentStatus,
  onPaymentSuccess,
  onCancel,
}: OrderPaymentSectionProps) {
  // 初始不选择任何支付方式，让用户自己选择
  const [paymentMethod, setPaymentMethod] = useState<'tng' | 'cash' | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(existingPaymentId || null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [processingCash, setProcessingCash] = useState(false);
  const [createPaymentError, setCreatePaymentError] = useState<string | null>(null);

  // 如果已有支付记录，自动选择TNG方式
  useEffect(() => {
    if (existingPaymentId && existingReceipt) {
      setPaymentMethod('tng');
    }
  }, [existingPaymentId, existingReceipt]);

  useEffect(() => {
    if (paymentMethod === 'tng' && !paymentId && !creatingPayment) {
      createPaymentRecord();
    }
  }, [paymentMethod, paymentId, creatingPayment]);

  const createPaymentRecord = async () => {
    if (paymentMethod !== 'tng') return;
    setCreatingPayment(true);
    setCreatePaymentError(null);
    try {
      const { payment, error } = await createPayment(amount, 'tng', orderId);
      
      if (error) {
        toast.error('创建支付记录失败: ' + error);
        console.error(error);
        setCreatePaymentError(error);
      } else if (payment) {
        setPaymentId(payment.id);
        setCreatePaymentError(null);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('创建支付记录失败');
      setCreatePaymentError('创建支付记录失败');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCashPayment = async () => {
    setProcessingCash(true);
    
    try {
      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '现金支付处理失败');
      }

      toast.success('现金支付已提交！请到店支付并等待管理员确认');
      
      // 强制刷新页面以显示最新状态
      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('❌ 现金支付错误:', error);
      toast.error(error.message || '现金支付失败');
    } finally {
      setProcessingCash(false);
    }
  };

  const handleReceiptUpload = async (receiptUrl: string) => {
    if (!paymentId) {
      toast.error('支付记录不存在');
      return;
    }

    try {
      const { error } = await uploadPaymentReceipt(paymentId, receiptUrl);
      
      if (error) {
        toast.error('更新支付记录失败');
        console.error(error);
      } else {
        setReceiptUploaded(true);
        toast.success('收据已提交，等待管理员审核');
        onPaymentSuccess?.();
      }
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      toast.error('提交收据失败');
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">完成支付</h2>
            <p className="text-sm text-gray-500">选择支付方式</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 支付方式选择 */}
      {!paymentMethod && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">选择支付方式</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('tng')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="mb-2 text-2xl">📱</div>
              <div className="font-medium text-gray-900">TNG 线上支付</div>
              <div className="mt-1 text-xs text-gray-500">扫码支付</div>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-green-500 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">💵</div>
              <div className="font-medium text-gray-900">现金支付</div>
              <div className="mt-1 text-xs text-gray-500">到店支付</div>
            </button>
          </div>
        </div>
      )}

      {/* TNG 支付流程 */}
      {paymentMethod === 'tng' && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
            <span className="text-sm font-medium text-blue-900">TNG 线上支付</span>
            <button
              onClick={() => {
                setPaymentMethod(null);
                setPaymentId(null);
                setCreatePaymentError(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              更换支付方式
            </button>
          </div>
          
          <TngQRCodeDisplay amount={amount} orderId={orderId} />

          {/* Receipt Uploader */}
          {creatingPayment ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center">
              <div className="animate-pulse text-gray-500">正在准备上传...</div>
            </div>
          ) : paymentId ? (
            <PaymentReceiptUploader
              paymentId={paymentId}
              orderId={orderId}
              existingReceiptUrl={existingReceipt}
              onUploadSuccess={handleReceiptUpload}
              onUploadError={(error) => {
                console.error('Upload error:', error);
              }}
            />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-6 text-center">
              <p className="text-red-600">创建支付记录失败，请刷新页面重试</p>
              <button
                onClick={createPaymentRecord}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                重试创建支付记录
              </button>
              {createPaymentError && (
                <p className="mt-2 text-xs text-red-500">错误：{createPaymentError}</p>
              )}
            </div>
          )}

          {/* Status Message */}
          {receiptUploaded && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="font-semibold text-green-900">✓ 支付收据已提交</p>
              <p className="mt-1 text-sm text-green-700">
                管理员将在 1-2 个工作日内审核您的支付收据，审核通过后订单将开始处理
              </p>
            </div>
          )}
        </>
      )}

      {/* 现金支付流程 */}
      {paymentMethod === 'cash' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <span className="text-sm font-medium text-green-900">现金支付</span>
            <button
              onClick={() => setPaymentMethod(null)}
              className="text-sm text-green-600 hover:underline"
            >
              更换支付方式
            </button>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">💵</div>
              <h3 className="text-lg font-semibold text-gray-900">现金支付</h3>
              <p className="mt-2 text-sm text-gray-600">
                请到店支付现金，确认后订单等待处理
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">应付金额</span>
                <span className="text-2xl font-bold text-gray-900">
                  RM {amount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCashPayment}
              disabled={processingCash}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingCash ? '处理中...' : '确认现金支付'}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              点击确认后，请到店支付现金。管理员确认收款后订单将开始处理
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
