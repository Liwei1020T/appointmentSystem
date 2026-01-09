/**
 * TNG 收款码显示组件
 * 
 * 用途：
 * - 显示商家的 TNG 收款二维码
 * - 显示支付金额
 * - 提供支付说明
 * 
 * 使用场景：
 * - 订单支付页面
 */

import React from 'react';
import { Smartphone, AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TngQRCodeDisplayProps {
  amount: number;
  orderId: string;
}

export default function TngQRCodeDisplay({ amount, orderId }: TngQRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Configuration - can be set via environment variables
  const qrCodeUrl = process.env.NEXT_PUBLIC_TNG_QR_PATH || '/images/tng-qr-code.png';
  const merchantPhone = process.env.NEXT_PUBLIC_MERCHANT_PHONE || '01X-XXXX-XXXX';
  const merchantName = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'LW String Studio';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(merchantPhone);
    setCopied(true);
    toast.success('已复制电话号码');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border-subtle bg-ink-surface p-6">
      {/* 标题 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-accent p-2">
          <Smartphone className="h-6 w-6 text-text-onAccent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Touch &apos;n Go eWallet 扫码支付</h3>
          <p className="text-sm text-text-secondary">使用 TNG 应用扫描二维码完成支付</p>
        </div>
      </div>

      {/* 支付金额 */}
      <div className="mb-4 rounded-lg bg-ink-surface p-4 text-center">
        <div className="text-sm text-text-secondary">应付金额</div>
        <div className="text-4xl font-bold text-accent">RM {amount.toFixed(2)}</div>
        <div className="mt-1 text-xs text-text-tertiary">订单编号：{orderId.slice(0, 8)}</div>
      </div>

      {/* 二维码 */}
      <div className="mb-4 flex justify-center rounded-lg bg-ink-surface p-6">
        <div className="relative">
          {/* TODO: 替换为实际的 QR Code 图片 */}
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-border-subtle bg-ink-elevated">
            <div className="text-center">
              <Smartphone className="mx-auto h-12 w-12 text-text-tertiary" />
              <p className="mt-2 text-sm text-text-tertiary">TNG 收款码</p>
              <p className="text-xs text-text-tertiary">请放置实际二维码图片</p>
            </div>
          </div>

          {/* 如果有实际图片，使用下面的代码：
          <img 
            src={qrCodeUrl} 
            alt="TNG QR Code" 
            className="h-64 w-64 rounded-lg border-2 border-border-subtle"
          />
          */}
        </div>
      </div>

      {/* 支付步骤说明 */}
      <div className="mb-4 rounded-lg bg-ink-surface p-4">
        <h4 className="mb-3 font-semibold text-text-primary">支付步骤：</h4>
        <ol className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              1
            </span>
            <span>打开 Touch &apos;n Go eWallet 应用</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              2
            </span>
            <span>点击 &quot;扫码&quot; 或 &quot;Scan&quot;</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              3
            </span>
            <span>扫描上方二维码</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              4
            </span>
            <span>
              确认支付金额为 <span className="font-semibold text-accent">RM {amount.toFixed(2)}</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              5
            </span>
            <span>完成支付后，截图保存支付收据</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-text-onAccent">
              6
            </span>
            <span className="font-semibold text-accent">上传支付收据到下方</span>
          </li>
        </ol>
      </div>

      {/* 手动转账选项 */}
      <div className="rounded-lg border border-border-subtle bg-ink-surface p-4">
        <h4 className="mb-2 text-sm font-semibold text-text-primary">或使用手动转账</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">TNG 电话号码：</span>
          <code className="rounded bg-ink-elevated px-2 py-1 text-sm font-mono text-text-primary">
            {merchantPhone}
          </code>
          <button
            onClick={handleCopyPhone}
            className="rounded-lg p-1.5 hover:bg-ink"
            title="复制电话号码"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4 text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* 重要提示 */}
      <div className="mt-4 flex gap-2 rounded-lg bg-warning/15 p-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
        <div className="text-xs text-text-secondary">
          <p className="font-semibold">重要提示：</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>请确保支付金额正确（RM {amount.toFixed(2)}）</li>
            <li>完成支付后请务必上传支付收据</li>
            <li>管理员审核通过后订单才会开始处理</li>
            <li>如有疑问请联系客服</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
