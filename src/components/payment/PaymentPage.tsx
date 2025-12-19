'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  getTngQrCodeUrl,
  getPaymentAccountName,
  getPaymentAccountPhone,
  formatAmount,
  generatePaymentReference,
  getPaymentInstructions,
} from '@/lib/payment-helpers';
import { uploadPaymentProof } from '@/services/payment.service';
import { validateProofFile } from '@/lib/payment-helpers';

interface PaymentPageProps {
  paymentId: string;
  amount: number;
  orderId: string;
  userId: string;
  onProofUploaded?: () => void;
}

export default function PaymentPage({
  paymentId,
  amount,
  orderId,
  userId,
  onProofUploaded,
}: PaymentPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const qrCodeUrl = getTngQrCodeUrl();
  const accountName = getPaymentAccountName();
  const accountPhone = getPaymentAccountPhone();
  const reference = generatePaymentReference(orderId, userId);
  const instructions = getPaymentInstructions();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateProofFile(file);
    if (!validation.valid) {
      setError(validation.error || '文件无效');
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请选择支付凭证');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await uploadPaymentProof(paymentId, selectedFile);
      setSuccess(true);
      if (onProofUploaded) {
        onProofUploaded();
      }
    } catch (err: any) {
      setError(err.message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-ink-surface rounded-lg shadow-lg border border-border-subtle">
        <div className="text-center">
          <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            支付凭证已提交
          </h2>
          <p className="text-text-secondary mb-6">
            我们会尽快审核您的支付凭证，请耐心等待
          </p>
          <button
            onClick={() => (window.location.href = '/orders')}
            className="px-6 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
          >
            查看我的订单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          扫码支付
        </h1>
        <p className="text-text-tertiary">
          请使用 Touch 'n Go 电子钱包扫描下方二维码完成支付
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 左侧：二维码 */}
        <div className="bg-ink-surface rounded-lg shadow-lg p-6 border border-border-subtle">
          <div className="text-center mb-4">
            <p className="text-sm text-text-tertiary mb-2">支付金额</p>
            <p className="text-4xl font-bold text-accent font-mono">
              {formatAmount(amount)}
            </p>
          </div>

          <div className="border-2 border-border-subtle rounded-lg p-4 mb-4 bg-ink-elevated">
            <Image
              src={qrCodeUrl}
              alt="TNG QR Code"
              width={300}
              height={300}
              className="w-full h-auto"
            />
          </div>

          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span className="text-text-tertiary">收款账户：</span>
              <span className="font-medium">{accountName}</span>
            </div>
            {accountPhone && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">收款号码：</span>
                <span className="font-medium">{accountPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-tertiary">参考号：</span>
              <span className="font-mono font-medium">{reference}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning">
              ⚠️ 请在支付时备注填写参考号：<strong>{reference}</strong>
            </p>
          </div>
        </div>

        {/* 右侧：支付步骤 */}
        <div className="space-y-6">
          {/* 支付步骤 */}
          <div className="bg-ink-surface rounded-lg shadow-lg p-6 border border-border-subtle">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              支付步骤
            </h2>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent text-text-onAccent rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="text-text-secondary">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 上传凭证 */}
          <div className="bg-ink-surface rounded-lg shadow-lg p-6 border border-border-subtle">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              上传支付凭证
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">
                  选择支付截图
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-text-tertiary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-ink-elevated file:text-text-secondary
                    hover:file:bg-ink-surface"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  支持 JPG、PNG 格式，最大 5MB
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-ink-elevated rounded-lg border border-border-subtle">
                  <p className="text-sm text-text-secondary">
                    已选择：{selectedFile.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    大小：{(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-text-onAccent
                  ${
                    !selectedFile || uploading
                      ? 'bg-ink-elevated text-text-tertiary cursor-not-allowed'
                      : 'bg-accent hover:shadow-glow'
                  }`}
              >
                {uploading ? '上传中...' : '提交支付凭证'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
