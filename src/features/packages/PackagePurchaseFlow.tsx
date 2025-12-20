/**
 * 套餐购买流程组件 (Package Purchase Flow)
 * 
 * 套餐购买确认、支付方式选择、支付处理
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buyPackage, getPackageById, Package } from '@/services/packageService';
import { uploadPaymentReceipt, PaymentMethod } from '@/services/paymentService';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import Toast from '@/components/Toast';
import { useSession } from 'next-auth/react';
import PaymentReceiptUploader from '@/components/PaymentReceiptUploader';
import TngQRCodeDisplay from '@/components/TngQRCodeDisplay';

export default function PackagePurchaseFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id');
  const { data: session } = useSession();
  const user = session?.user;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 1: 确认, 2: 支付方式, 3: 支付中, 4: 完成
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tng');
  const [processing, setProcessing] = useState<boolean>(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 支付方式选项 (仅 TNG QR Code 和现金)
  const paymentMethods: { value: PaymentMethod; label: string; icon: string; description: string }[] = [
    { value: 'tng', label: 'Touch n Go eWallet', icon: '💰', description: '扫描 QR Code 支付' },
    { value: 'cash', label: '到店支付', icon: '💵', description: '到店后现金支付' },
  ];

  // 加载套餐信息
  const loadPackage = async () => {
    if (!packageId) {
      setError('套餐ID缺失');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { package: data, error: err } = await getPackageById(packageId);

    if (err || !data) {
      setError(err || '加载套餐失败');
      setPkg(null);
    } else {
      setPkg(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    // 检查登录状态
    if (!user) {
      router.push('/login?redirect=/packages');
      return;
    }

    loadPackage();
  }, [packageId, user]);

  // 处理下一步
  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      handlePayment();
    }
  };

  // 处理支付
  const handlePayment = async () => {
    if (!pkg) return;

    setProcessing(true);
    setReceiptUploaded(false);
    setStep(3);

    try {
      /**
       * 创建“套餐支付”记录（不直接创建 user_packages）
       *
       * 说明：
       * - TNG：用户扫码后上传收据 → 支付状态变为 pending_verification → 管理员审核通过 → 创建 user_packages
       * - 现金：创建 cash pending → 管理员确认收款 → 创建 user_packages
       */
      const data = await buyPackage(pkg.id, paymentMethod);
      const createdPaymentId = data?.paymentId as string | undefined;

      if (!createdPaymentId) {
        throw new Error('创建支付失败（缺少 paymentId）');
      }

      setPaymentId(createdPaymentId);

      // 现金支付无需上传收据，直接进入完成页等待管理员确认
      if (paymentMethod === 'cash') {
        setStep(4);
        setToast({
          show: true,
          message: '已提交现金支付申请，等待管理员确认后生效',
          type: 'success',
        });
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '购买失败',
        type: 'error',
      });
      setStep(2);
      setProcessing(false);
      return;
    }

    setProcessing(false);
  };

  /**
   * 收据上传成功后的回调
   * - 更新 payments 记录（receiptUrl + pending_verification）
   * - 显示等待审核提示，并跳转到“我的套餐”
   */
  const handleReceiptUpload = async (receiptUrl: string) => {
    if (!paymentId) return;

    setProcessing(true);
    try {
      const { error } = await uploadPaymentReceipt(paymentId, receiptUrl);
      if (error) throw new Error(error);

      setReceiptUploaded(true);
      setStep(4);
      setToast({
        show: true,
        message: '收据已提交，等待管理员审核通过后即可在“我的套餐”查看',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/profile/packages');
      }, 2000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '提交收据失败',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // 错误状态
  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-ink p-4">
        <Card className="p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-danger mb-4">{error || '套餐不存在'}</p>
          <Button onClick={() => router.push('/packages')}>返回套餐列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary"
            disabled={processing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">购买套餐</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 进度指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s <= step
                    ? 'bg-accent text-text-onAccent'
                    : 'bg-ink-elevated text-text-tertiary'
                  }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${s < step ? 'bg-accent' : 'bg-ink-elevated'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 确认套餐信息 */}
        {step === 1 && (
          <>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">确认套餐信息</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">套餐名称</span>
                  <span className="font-semibold text-text-primary">{pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">穿线次数</span>
                  <span className="font-semibold text-text-primary">{pkg.times} 次</span>
                </div>
                {pkg.validityDays && (
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">有效期</span>
                    <span className="font-semibold text-text-primary">{pkg.validityDays} 天</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                  <span className="text-lg font-semibold text-text-primary">总价</span>
                  <span className="text-2xl font-bold text-accent font-mono">
                    RM {Number(pkg.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {pkg.description && (
              <Card className="p-6 bg-ink-elevated border border-border-subtle">
                <h3 className="font-semibold text-text-primary mb-2">套餐说明</h3>
                <p className="text-sm text-text-secondary">{pkg.description}</p>
              </Card>
            )}
          </>
        )}

        {/* Step 2: 选择支付方式 */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">选择支付方式</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${paymentMethod === method.value
                      ? 'border-accent-border bg-ink-elevated'
                      : 'border-border-subtle hover:border-accent-border'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">{method.label}</h3>
                      <p className="text-sm text-text-secondary">{method.description}</p>
                    </div>
                    {paymentMethod === method.value && (
                      <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: 支付 / 上传收据 */}
        {step === 3 && (
          <div className="space-y-4">
            {processing ? (
              <Card className="p-12 text-center">
                <Spinner size="lg" className="mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  正在创建支付记录...
                </h3>
                <p className="text-text-secondary">请稍候，不要关闭此页面</p>
              </Card>
            ) : paymentMethod === 'cash' ? (
              <Card className="p-8">
                <h3 className="text-lg font-semibold text-text-primary mb-2">现金支付</h3>
                <p className="text-text-secondary">
                  已提交现金支付申请，请到店支付现金。管理员确认收款后，套餐将自动生效并显示在“我的套餐”。
                </p>
                {paymentId ? (
                  <p className="mt-3 text-sm text-text-tertiary">
                    支付单号：{paymentId.slice(0, 8)}
                  </p>
                ) : null}
              </Card>
            ) : (
              <>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">TNG 线上支付</h3>
                  <p className="text-text-secondary">
                    扫码支付后请上传收据，管理员审核通过后套餐才会生效并显示在“我的套餐”。
                  </p>
                </Card>

                <TngQRCodeDisplay amount={Number(pkg.price)} orderId={paymentId || pkg.id} />

                {paymentId ? (
                  <PaymentReceiptUploader
                    paymentId={paymentId}
                    orderId={paymentId}
                    existingReceiptUrl={undefined}
                    onUploadSuccess={handleReceiptUpload}
                    onUploadError={(err) => {
                      console.error('Upload receipt error:', err);
                    }}
                  />
                ) : (
                  <Card className="p-6 border-danger/30 bg-danger/10">
                    <p className="text-sm text-danger">创建支付记录失败，请返回重试</p>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: 已提交（等待管理员确认/审核） */}
        {step === 4 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/30">
              <svg className="w-10 h-10 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              {paymentMethod === 'cash' ? '已提交现金支付申请' : '已提交支付收据'}
            </h3>
            <p className="text-text-secondary mb-6">
              {paymentMethod === 'cash'
                ? '管理员确认收款后，套餐将自动生效并显示在“我的套餐”。'
                : receiptUploaded
                  ? '管理员审核通过后，套餐将自动生效并显示在“我的套餐”。'
                  : '请先上传收据以提交审核。'}
            </p>
            <Button onClick={() => router.push('/profile/packages')}>查看我的套餐</Button>
          </Card>
        )}

        {/* 底部操作栏 */}
        {(step === 1 || step === 2) && (
          <div className="sticky bottom-0 left-0 right-0 glass-surface border-t border-border-subtle p-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  disabled={processing}
                >
                  上一步
                </Button>
              )}
              <Button
                onClick={handleNext}
                fullWidth
                disabled={processing}
              >
                {step === 1 ? '下一步' : '确认支付'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
