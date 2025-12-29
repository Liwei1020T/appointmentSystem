/**
 * 支付收据上传组件
 * 
 * 用途：
 * - 用户上传支付收据图片
 * - 图片预览
 * - 上传到服务器存储
 * - 更新支付记录状态
 * 
 * 使用场景：
 * - 订单支付页面
 * - 套餐购买支付（传入 paymentId 作为 folderId / orderId，用于区分上传目录）
 */

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { uploadImage, deleteImage } from '@/services/imageUploadService';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

interface PaymentReceiptUploaderProps {
  paymentId: string;
  /**
   * 上传目录标识（历史命名为 orderId）
   * - 订单支付：传入 orderId
   * - 套餐支付：可传入 paymentId 或 packageId
   */
  orderId: string;
  existingReceiptUrl?: string;
  onUploadSuccess: (receiptUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export default function PaymentReceiptUploader({
  paymentId,
  orderId,
  existingReceiptUrl,
  onUploadSuccess,
  onUploadError,
}: PaymentReceiptUploaderProps) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(existingReceiptUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingReceiptUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      onUploadError?.('Invalid file type');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      onUploadError?.('File too large');
      return;
    }

    setUploading(true);

    try {
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 上传到服务器存储
      const { url, error } = await uploadImage(file, {
        bucket: 'receipts',
        folder: orderId,
        fileName: `${paymentId}_${Date.now()}.jpg`,
        compress: true,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (error) {
        toast.error('上传失败：' + error);
        onUploadError?.(error);
        setPreviewUrl(null);
      } else if (url) {
        setReceiptUrl(url);
        toast.success('收据上传成功');
        onUploadSuccess(url);
      }
    } catch (error: any) {
      console.error('Failed to upload receipt:', error);
      toast.error('上传失败');
      onUploadError?.(error.message);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  // 处理文件输入变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 处理放置文件
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 删除收据
  const handleRemove = async () => {
    if (!receiptUrl) return;

    try {
      // 可选：从 Storage 删除图片
      // await deleteImage(receiptUrl);
      
      setReceiptUrl(null);
      setPreviewUrl(null);
      toast.success('已移除收据');
    } catch (error) {
      console.error('Failed to remove receipt:', error);
      toast.error('移除失败');
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-border-subtle bg-ink-surface p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
        <ImageIcon className="h-5 w-5 text-accent" />
        上传支付收据
      </h3>

      {!previewUrl ? (
        // 上传区域
        <div
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all
            ${dragActive
              ? 'border-accent-border bg-ink-elevated'
              : 'border-border-subtle bg-ink-elevated hover:border-accent-border hover:bg-ink-elevated'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size="lg" className="w-12 h-12" />
              <p className="text-sm text-text-secondary">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-text-tertiary" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  点击或拖拽图片到此处
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  支持 JPG、PNG 格式，最大 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // 预览区域
        <div className="space-y-4">
          <div className="relative rounded-lg border border-border-subtle bg-ink-elevated p-4">
            <img
              src={previewUrl}
              alt="Payment Receipt"
              className="mx-auto max-h-96 rounded-lg object-contain"
            />
            
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute right-2 top-2 rounded-full bg-danger p-2 text-text-primary shadow-lg hover:bg-danger/90"
                title="移除收据"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {receiptUrl && !uploading && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
              <Check className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">
                  收据已上传成功
                </p>
                <p className="text-xs text-text-secondary">
                  管理员将在 1-2 个工作日内审核
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:bg-ink-elevated"
            disabled={uploading}
          >
            重新上传
          </button>
        </div>
      )}

      {/* 温馨提示 */}
      <div className="mt-4 flex gap-2 rounded-lg bg-info-soft p-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-info" />
        <div className="text-xs text-text-secondary">
          <p className="font-semibold">上传要求：</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>请确保收据图片清晰可见</li>
            <li>收据必须包含完整的交易信息</li>
            <li>请确保支付金额与订单金额一致</li>
            <li>收据必须包含交易时间和交易ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
