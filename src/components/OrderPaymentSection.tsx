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
  paymentId?: string; // 如果已有支付记录
  existingReceipt?: string; // 已上传的收据
  paymentStatus?: string; // 支付状态
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
  const [paymentId, setPaymentId] = useState<string | null>(existingPaymentId || null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  // 创建支付记录
  useEffect(() => {
    if (!paymentId) {
      createPaymentRecord();
    }
  }, []);

  const createPaymentRecord = async () => {
    try {
      const { payment, error } = await createPayment(amount, 'tng', orderId);
      
      if (error) {
        toast.error('创建支付记录失败');
        console.error(error);
      } else if (payment) {
        setPaymentId(payment.id);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('创建支付记录失败');
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
            <p className="text-sm text-gray-500">扫描二维码并上传支付收据</p>
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

      {/* TNG QR Code */}
      <TngQRCodeDisplay amount={amount} orderId={orderId} />

      {/* Receipt Uploader */}
      {paymentId && (
        <PaymentReceiptUploader
          paymentId={paymentId}
          orderId={orderId}
          existingReceiptUrl={existingReceipt}
          onUploadSuccess={handleReceiptUpload}
          onUploadError={(error) => {
            console.error('Upload error:', error);
          }}
        />
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
    </div>
  );
}
