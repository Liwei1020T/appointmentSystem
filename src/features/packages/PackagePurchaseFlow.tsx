/**
 * 套餐购买流程组件 (Package Purchase Flow)
 * 
 * 套餐购买确认、支付方式选择、支付处理
 * 包含：页面动画、进度条优化、卡片增强
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buyPackage, getPackageById, Package } from '@/services/packageService';
import { uploadPaymentReceipt, PaymentMethod } from '@/services/paymentService';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import Toast from '@/components/Toast';
import { useSession } from 'next-auth/react';
import PaymentReceiptUploader from '@/components/PaymentReceiptUploader';
import TngQRCodeDisplay from '@/components/TngQRCodeDisplay';

// 步骤标签
const stepLabels = ['确认', '支付', '处理', '完成'];

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
  const [isVisible, setIsVisible] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 页面进入动画
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 支付方式选项 (仅 TNG QR Code 和现金)
  const paymentMethods: { value: PaymentMethod; label: string; icon: string; description: string }[] = [
    { value: 'tng', label: 'Touch n Go eWallet', icon: 'TnG', description: '扫描 QR Code 支付' },
    { value: 'cash', label: '到店支付', icon: '$', description: '到店后现金支付' },
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
        message: '收据已提交，等待管理员审核通过后即可在"我的套餐"查看',
        type: 'success',
      });


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

  // 加载状态 - 骨架屏
  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="w-6 h-6 bg-ink-elevated rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-ink-elevated rounded animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-ink-elevated animate-pulse"></div>
                {s < 4 && <div className="w-16 h-1 bg-ink-elevated animate-pulse"></div>}
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-ink-surface border border-border-subtle p-6 animate-pulse">
            <div className="h-6 bg-ink-elevated rounded w-32 mb-6"></div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-4 bg-ink-elevated rounded w-20"></div>
                <div className="h-4 bg-ink-elevated rounded w-24"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-ink-elevated rounded w-20"></div>
                <div className="h-4 bg-ink-elevated rounded w-16"></div>
              </div>
              <div className="flex justify-between pt-4 border-t border-border-subtle">
                <div className="h-6 bg-ink-elevated rounded w-12"></div>
                <div className="h-8 bg-ink-elevated rounded w-28"></div>
              </div>
            </div>
          </div>
        </div>
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

  // 计算节省金额
  const averagePrice = 50;
  const savings = (averagePrice * pkg.times) - Number(pkg.price);

  return (
    <div className="min-h-screen bg-ink relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-success/5 rounded-full blur-3xl"></div>
      </div>

      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary transition-colors"
            disabled={processing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`
            text-lg font-semibold text-text-primary
            transition-all duration-500
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}>
            购买套餐
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6 relative z-1">
        {/* 进度指示器 - 增强版 */}
        <div className={`
          flex items-center justify-center gap-0 mb-8
          transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300
                    ${s <= step
                      ? 'bg-accent text-text-onAccent shadow-lg shadow-accent/30'
                      : 'bg-ink-elevated text-text-tertiary'
                    }
                    ${s === step ? 'scale-110 ring-4 ring-accent/20' : ''}
                  `}
                >
                  {s < step ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s}
                </div>
                <span className={`
                  text-xs mt-1.5 font-medium
                  ${s <= step ? 'text-accent' : 'text-text-tertiary'}
                `}>
                  {stepLabels[s - 1]}
                </span>
              </div>
              {s < 4 && (
                <div
                  className={`
                    w-12 h-1 mx-1 rounded-full transition-all duration-500
                    ${s < step ? 'bg-accent' : 'bg-ink-elevated'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 确认套餐信息 */}
        {step === 1 && (
          <div className={`
            space-y-4
            transition-all duration-500 ease-out delay-100
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            <Card className="p-6 border-2 border-border-subtle hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">确认套餐信息</h2>
                  <p className="text-sm text-text-secondary">请核对以下信息</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border-subtle">
                  <span className="text-text-tertiary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    套餐名称
                  </span>
                  <span className="font-semibold text-text-primary">{pkg.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border-subtle">
                  <span className="text-text-tertiary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    穿线次数
                  </span>
                  <span className="font-bold text-accent text-lg">{pkg.times} 次</span>
                </div>
                {pkg.validityDays && (
                  <div className="flex justify-between items-center py-3 border-b border-border-subtle">
                    <span className="text-text-tertiary flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      有效期
                    </span>
                    <span className="font-semibold text-text-primary">{pkg.validityDays} 天</span>
                  </div>
                )}

                {/* 价格区域 */}
                <div className="pt-4 mt-2 bg-gradient-to-r from-accent/10 to-accent/5 -mx-6 -mb-6 px-6 py-5 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-text-primary">总价</span>
                      {savings > 0 && (
                        <p className="text-xs text-success mt-0.5">比单次购买省 RM {savings.toFixed(0)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-accent font-mono">
                        RM {Number(pkg.price).toFixed(2)}
                      </span>
                      <p className="text-xs text-text-tertiary">
                        平均 RM {(Number(pkg.price) / pkg.times).toFixed(2)}/次
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {pkg.description && (
              <Card className="p-5 bg-ink-elevated border border-border-subtle hover:border-info/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">套餐说明</h3>
                    <p className="text-sm text-text-secondary">{pkg.description}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: 选择支付方式 */}
        {step === 2 && (
          <div className={`
            transition-all duration-500 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">选择支付方式</h2>
                  <p className="text-sm text-text-secondary">选择您偏好的支付方式</p>
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`
                      w-full p-5 rounded-xl border-2 text-left transition-all duration-200
                      ${paymentMethod === method.value
                        ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                        : 'border-border-subtle hover:border-accent/50 hover:bg-ink-elevated'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center text-3xl
                        ${paymentMethod === method.value ? 'bg-accent/20' : 'bg-ink-elevated'}
                        transition-colors
                      `}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-text-primary text-lg">{method.label}</h3>
                        <p className="text-sm text-text-secondary">{method.description}</p>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        transition-all
                        ${paymentMethod === method.value
                          ? 'border-accent bg-accent'
                          : 'border-border-subtle'
                        }
                      `}>
                        {paymentMethod === method.value && (
                          <svg className="w-4 h-4 text-text-onAccent" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 支付金额摘要 */}
              <div className="mt-6 p-4 bg-ink-elevated rounded-xl border border-border-subtle">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">支付金额</span>
                  <span className="text-xl font-bold text-accent font-mono">
                    RM {Number(pkg.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: 支付 / 上传收据 */}
        {step === 3 && (
          <div className="space-y-4">
            {processing ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/15 flex items-center justify-center animate-pulse">
                  <LoadingSpinner size="lg" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  正在创建支付记录...
                </h3>
                <p className="text-text-secondary">请稍候，不要关闭此页面</p>
              </Card>
            ) : paymentMethod === 'cash' ? (
              <Card className="p-8">
                <h3 className="text-lg font-semibold text-text-primary mb-2">现金支付</h3>
                <p className="text-text-secondary">
                  已提交现金支付申请，请到店支付现金。管理员确认收款后，套餐将自动生效并显示在"我的套餐"。
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
                    扫码支付后请上传收据，管理员审核通过后套餐才会生效并显示在"我的套餐"。
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

        {/* Step 4: 已提交 */}
        {step === 4 && (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-success/20 to-success/5 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-success/30 animate-bounce">
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
            <p className="text-text-secondary mb-8">
              {paymentMethod === 'cash'
                ? '管理员确认收款后，套餐将自动生效并显示在"我的套餐"。'
                : receiptUploaded
                  ? '管理员审核通过后，套餐将自动生效并显示在"我的套餐"。'
                  : '请先上传收据以提交审核。'}
            </p>
            <Button onClick={() => router.push('/profile/packages')} className="px-8">
              查看我的套餐
            </Button>
          </Card>
        )}

        {/* 底部操作栏 */}
        {(step === 1 || step === 2) && (
          <div className={`
            sticky bottom-0 left-0 right-0 glass-surface border-t border-border-subtle p-4 -mx-4 mt-8
            transition-all duration-500
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            <div className="max-w-2xl mx-auto flex gap-3">
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  disabled={processing}
                  className="px-6"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步
                </Button>
              )}
              <Button
                onClick={handleNext}
                fullWidth
                disabled={processing}
                className="shadow-lg shadow-accent/30"
              >
                {step === 1 ? '下一步' : '确认支付'}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
