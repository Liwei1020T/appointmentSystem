/**
 * 套餐购买流程组件 (Package Purchase Flow)
 * 
 * 套餐购买确认、支付方式选择、支付处理
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPackageById, purchasePackage, Package } from '@/services/package.service';
import { createPayment, simulatePayment, PaymentMethod } from '@/services/paymentService';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { useSession } from 'next-auth/react';

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
    setStep(3);

    try {
      // 1. 创建支付记录
      const { payment, error: paymentError } = await createPayment(Number(pkg.price), paymentMethod);

      if (paymentError || !payment) {
        throw new Error(paymentError || '创建支付失败');
      }

      setPaymentId(payment.id);

      // 2. 模拟支付处理（实际应跳转到支付网关）
      if (paymentMethod === 'cash') {
        // 到店支付直接创建套餐
        await completePurchase();
      } else {
        // 模拟网关支付
        const { success } = await simulatePayment(payment.id, Number(pkg.price));

        if (!success) {
          throw new Error('支付失败');
        }

        // 3. 支付成功后创建用户套餐
        await completePurchase();
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '购买失败',
        type: 'error',
      });
      setStep(2);
      setProcessing(false);
    }
  };

  // 完成购买
  const completePurchase = async () => {
    if (!pkg) return;

    const { success, error } = await purchasePackage(pkg.id, paymentMethod);

    if (error || !success) {
      throw new Error(error || '创建套餐失败');
    }

    setProcessing(false);
    setStep(4);

    setToast({
      show: true,
      message: '购买成功！',
      type: 'success',
    });

    // 3秒后跳转到我的套餐页面
    setTimeout(() => {
      router.push('/profile/packages');
    }, 3000);
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
      <div className="min-h-screen bg-slate-50 p-4">
        <Card className="p-6 text-center max-w-md mx-auto mt-12">
          <p className="text-red-600 mb-4">{error || '套餐不存在'}</p>
          <Button onClick={() => router.push('/packages')}>返回套餐列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
            disabled={processing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900">购买套餐</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 进度指示器 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    s < step ? 'bg-blue-600' : 'bg-slate-200'
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">确认套餐信息</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">套餐名称</span>
                  <span className="font-semibold text-slate-900">{pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">穿线次数</span>
                  <span className="font-semibold text-slate-900">{pkg.times} 次</span>
                </div>
                {pkg.validityDays && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">有效期</span>
                    <span className="font-semibold text-slate-900">{pkg.validityDays} 天</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="text-lg font-semibold text-slate-900">总价</span>
                  <span className="text-2xl font-bold text-blue-600">
                    RM {Number(pkg.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {pkg.description && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-2">套餐说明</h3>
                <p className="text-sm text-slate-700">{pkg.description}</p>
              </Card>
            )}
          </>
        )}

        {/* Step 2: 选择支付方式 */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">选择支付方式</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{method.label}</h3>
                      <p className="text-sm text-slate-600">{method.description}</p>
                    </div>
                    {paymentMethod === method.value && (
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Step 3: 支付处理中 */}
        {step === 3 && (
          <Card className="p-12 text-center">
            <Spinner size="lg" className="mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">正在处理支付...</h3>
            <p className="text-slate-600">请稍候，不要关闭此页面</p>
          </Card>
        )}

        {/* Step 4: 购买成功 */}
        {step === 4 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">购买成功！</h3>
            <p className="text-slate-600 mb-6">
              套餐已添加到您的账户，现在可以开始使用了
            </p>
            <p className="text-sm text-slate-500">3秒后自动跳转到我的套餐...</p>
          </Card>
        )}

        {/* 底部操作栏 */}
        {(step === 1 || step === 2) && (
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
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
