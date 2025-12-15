/**
 * 管理员收据审核组件
 * 
 * 用途：
 * - 查看用户上传的支付收据
 * - 审核支付收据（通过/拒绝）
 * - 查看收据详情
 * 
 * 使用场景：
 * - 管理员订单详情页面
 */

import React, { useState } from 'react';
import { Check, X, Image as ImageIcon, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentReceiptVerifierProps {
  receiptUrl?: string | null;
  paymentStatus: string;
  paymentId: string;
  verifiedAt?: string | null;
  verifiedBy?: string;
  adminNotes?: string | null;
  onVerify: (approved: boolean, notes?: string) => Promise<void>;
}

export default function PaymentReceiptVerifier({
  receiptUrl,
  paymentStatus,
  paymentId,
  verifiedAt,
  verifiedBy,
  adminNotes,
  onVerify,
}: PaymentReceiptVerifierProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState('');

  // 处理审核
  const handleVerify = async (approved: boolean) => {
    const action = approved ? '通过' : '拒绝';
    
    if (!approved && !notes.trim()) {
      toast.error('拒绝时必须填写备注');
      return;
    }

    if (!confirm(`确认${action}此支付收据吗？`)) return;

    setVerifying(true);
    try {
      await onVerify(approved, notes.trim() || undefined);
      toast.success(`收据已${action}`);
      setNotes('');
    } catch (error: any) {
      toast.error(`${action}失败：` + error.message);
    } finally {
      setVerifying(false);
    }
  };

  // 如果没有收据
  if (!receiptUrl) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">用户尚未上传支付收据</p>
        <p className="mt-1 text-xs text-gray-500">请提醒用户完成支付并上传收据</p>
      </div>
    );
  }

  // 已审核状态
  const isVerified = paymentStatus === 'completed';
  const isPending = paymentStatus === 'pending_verification';

  return (
    <div className="space-y-4">
      {/* 收据预览 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">支付收据</h4>
          <button
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            查看大图
          </button>
        </div>

        <div className="relative">
          <img
            src={receiptUrl}
            alt="Payment Receipt"
            className="w-full cursor-pointer rounded-lg border border-gray-200 object-contain"
            style={{ maxHeight: '400px' }}
            onClick={() => setShowImageModal(true)}
          />
        </div>
      </div>

      {/* 审核状态 */}
      {isVerified && (
        <div className="flex gap-2 rounded-lg bg-green-50 p-4">
          <Check className="h-5 w-5 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-green-900">收据已审核通过</p>
            {verifiedAt && (
              <p className="mt-1 text-xs text-green-700">
                审核时间：{new Date(verifiedAt).toLocaleString('zh-CN')}
              </p>
            )}
            {adminNotes && (
              <p className="mt-1 text-sm text-green-800">备注：{adminNotes}</p>
            )}
          </div>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="flex gap-2 rounded-lg bg-red-50 p-4">
          <X className="h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">收据已被拒绝</p>
            {adminNotes && (
              <p className="mt-1 text-sm text-red-800">拒绝原因：{adminNotes}</p>
            )}
          </div>
        </div>
      )}

      {/* 待审核 - 显示审核表单 */}
      {isPending && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-900">待审核</h4>
          </div>

          {/* 审核备注 */}
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              审核备注（拒绝时必填）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="请输入审核备注，如拒绝请说明原因..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 审核按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => handleVerify(false)}
              disabled={verifying}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  拒绝
                </>
              )}
            </button>
            <button
              onClick={() => handleVerify(true)}
              disabled={verifying}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  通过
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 图片查看模态框 */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={receiptUrl}
              alt="Payment Receipt"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
