/**
 * 退款申请模态框组件
 * 
 * 用途：
 * - 管理员发起退款申请
 * - 支持全额退款和部分退款
 * - 验证退款金额
 * - 填写退款原因
 * 
 * 使用场景：
 * - 订单详情页面
 * - 支付记录管理页面
 */

import React, { useState } from 'react';
import { X, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { createRefund, RefundType } from '@/services/refundService';
import { toast } from 'sonner';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  paymentAmount: number;
  paymentProvider: string;
  orderId?: string;
  onRefundCreated?: () => void;
}

export default function RefundRequestModal({
  isOpen,
  onClose,
  paymentId,
  paymentAmount,
  paymentProvider,
  orderId,
  onRefundCreated,
}: RefundRequestModalProps) {
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [refundAmount, setRefundAmount] = useState<string>(paymentAmount.toFixed(2));
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 重置表单
  const resetForm = () => {
    setRefundType('full');
    setRefundAmount(paymentAmount.toFixed(2));
    setReason('');
    setAdminNotes('');
  };

  // 处理退款类型切换
  const handleRefundTypeChange = (type: RefundType) => {
    setRefundType(type);
    if (type === 'full') {
      setRefundAmount(paymentAmount.toFixed(2));
    } else {
      setRefundAmount('');
    }
  };

  // 验证退款金额
  const validateRefundAmount = (): boolean => {
    const amount = parseFloat(refundAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的退款金额');
      return false;
    }

    if (amount > paymentAmount) {
      toast.error('退款金额不能超过原支付金额');
      return false;
    }

    return true;
  };

  // 提交退款申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('请填写退款原因');
      return;
    }

    if (refundType === 'partial' && !validateRefundAmount()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { success, error } = await createRefund({
        payment_id: paymentId,
        refund_type: refundType,
        refund_amount: parseFloat(refundAmount),
        reason: reason.trim(),
        admin_notes: adminNotes.trim() || undefined,
      });

      if (success) {
        toast.success('退款申请已创建');
        resetForm();
        onClose();
        onRefundCreated?.();
      } else {
        toast.error(error || '创建退款申请失败');
      }
    } catch (error: any) {
      console.error('Failed to create refund:', error);
      toast.error('创建退款申请失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">创建退款申请</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 支付信息 */}
          <div className="rounded-lg bg-blue-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">原支付金额</span>
              <span className="font-semibold text-gray-900">
                RM {paymentAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">支付方式</span>
              <span className="font-medium text-gray-900 uppercase">
                {paymentProvider}
              </span>
            </div>
          </div>

          {/* 退款类型选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              退款类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRefundTypeChange('full')}
                className={`
                  px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                  ${refundType === 'full'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                全额退款
              </button>
              <button
                type="button"
                onClick={() => handleRefundTypeChange('partial')}
                className={`
                  px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                  ${refundType === 'partial'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                部分退款
              </button>
            </div>
          </div>

          {/* 退款金额输入（部分退款时显示） */}
          {refundType === 'partial' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                退款金额 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                最大金额：RM {paymentAmount.toFixed(2)}
              </p>
            </div>
          )}

          {/* 退款原因 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              退款原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细说明退款原因，例如：客户取消订单、服务质量问题等"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* 管理员备注（可选） */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              管理员备注（可选）
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="内部备注，不会显示给用户"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 提示信息 */}
          {paymentProvider === 'tng' && (
            <div className="flex gap-3 rounded-lg bg-blue-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">TNG 退款说明</p>
                <p className="mt-1 text-blue-700">
                  TNG 支付退款需要手动处理，批准后请通过 Touch n Go 平台进行退款操作。
                </p>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  创建中...
                </span>
              ) : (
                '创建退款申请'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
