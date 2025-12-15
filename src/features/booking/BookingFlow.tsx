/**
 * 预约流程主组件 (Booking Flow)
 * 
 * 整合所有子组件，处理订单创建流程
 * 步骤：选择球线 → 输入拉力 → 套餐/优惠券 → 确认下单
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge, Toast, Spinner, Checkbox } from '@/components';
import { useSession } from 'next-auth/react';
import StringSelector from '@/features/booking/StringSelector';
import TensionInput from '@/features/booking/TensionInput';
import VoucherSelector from '@/features/booking/VoucherSelector';
import { StringInventory, UserVoucher } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { hasAvailablePackage, getPriorityPackage } from '@/services/packageService';
import { calculateDiscount } from '@/services/voucherService';

export default function BookingFlow() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  // 订单状态
  const [selectedString, setSelectedString] = useState<StringInventory | null>(null);
  const [tension, setTension] = useState<number | null>(null);
  const [usePackage, setUsePackage] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
  const [notes, setNotes] = useState('');

  // UI 状态
  const [step, setStep] = useState(1); // 1: 选球线, 2: 拉力, 3: 优惠, 4: 确认
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });
  const [packageAvailable, setPackageAvailable] = useState(false);

  /**
   * 如果未登录，跳转到登录页
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * 检查用户是否有可用套餐
   */
  useEffect(() => {
    if (user) {
      checkPackageAvailability();
    }
  }, [user]);

  const checkPackageAvailability = async () => {
    const available = await hasAvailablePackage();
    setPackageAvailable(available);
  };

  /**
   * 计算价格
   */
  const calculatePrice = () => {
    if (!selectedString) return { original: 0, discount: 0, final: 0 };

    const original = Number(selectedString.sellingPrice) || 0;
    let discount = 0;

    // 如果使用优惠券
    if (selectedVoucher && !usePackage) {
      discount = calculateDiscount(selectedVoucher, original);
    }

    const final = usePackage ? 0 : original - discount;

    return { original, discount, final };
  };

  const { original, discount, final } = calculatePrice();

  /**
   * 验证当前步骤
   */
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1 && !selectedString) {
      newErrors.string = '请选择球线';
    }

    if (currentStep === 2) {
      if (!tension) {
        newErrors.tension = '请输入拉力值';
      } else if (tension < 18 || tension > 30) {
        newErrors.tension = '拉力范围应在 18-30 磅之间';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 下一步
   */
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * 上一步
   */
  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * 提交订单
   */
  const handleSubmit = async () => {
    if (!selectedString || !tension || !user) return;

    setLoading(true);

    try {
      // 创建订单
      const orderData = {
        user_id: user.id,
        string_id: selectedString.id,
        tension,
        price: Number(selectedString.sellingPrice),
        cost_price: Number(selectedString.costPrice),
        discount_amount: discount,
        final_price: final,
        use_package: usePackage,
        voucher_id: selectedVoucher?.voucher?.id || null,
        status: 'pending',
        notes,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建订单失败');
      }

      const data = await response.json();

      // 成功提示
      setToast({
        show: true,
        message: '预约成功！正在跳转...',
        type: 'success',
      });

      // 跳转到订单详情
      setTimeout(() => {
        router.push(`/orders/${data.id}`);
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '预约失败，请重试',
        type: 'error',
      });
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => step === 1 ? router.push('/') : handleBack()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">立即预约</h1>
            <p className="text-xs text-slate-600">
              步骤 {step}/4
            </p>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32">
        {/* 进度指示器 */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  num < step
                    ? 'bg-blue-600 text-white'
                    : num === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {num < step ? '✓' : num}
              </div>
              {num < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    num < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* 步骤 1: 选择球线 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">选择球线</h2>
            <StringSelector
              selectedString={selectedString}
              onSelect={setSelectedString}
            />
            {errors.string && (
              <p className="text-sm text-red-600 mt-2">{errors.string}</p>
            )}
          </div>
        )}

        {/* 步骤 2: 输入拉力 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">设置拉力</h2>
            <TensionInput
              tension={tension}
              onTensionChange={setTension}
              error={errors.tension}
            />
          </div>
        )}

        {/* 步骤 3: 选择优惠 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">选择优惠</h2>

            {/* 套餐选项 */}
            {packageAvailable && (
              <Card>
                <div className="p-4">
                  <Checkbox
                    label="使用套餐抵扣（免费）"
                    checked={usePackage}
                    onChange={(e) => {
                      setUsePackage(e.target.checked);
                      if (e.target.checked) {
                        setSelectedVoucher(null);
                      }
                    }}
                  />
                  <p className="text-xs text-slate-600 mt-2 ml-6">
                    使用套餐后，本次穿线免费，套餐次数 -1
                  </p>
                </div>
              </Card>
            )}

            {/* 优惠券选择 */}
            {!usePackage && (
              <VoucherSelector
                orderAmount={original}
                selectedVoucher={selectedVoucher}
                onSelect={setSelectedVoucher}
              />
            )}
          </div>
        )}

        {/* 步骤 4: 确认订单 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">确认订单</h2>

            {/* 订单摘要 */}
            <Card>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">球线信息</h3>
                  <p className="font-semibold text-slate-900">
                    {selectedString?.brand} {selectedString?.model}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedString?.specification}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">拉力</h3>
                  <p className="font-semibold text-slate-900">{tension} 磅</p>
                </div>

                {usePackage && (
                  <div>
                    <Badge variant="success">使用套餐抵扣</Badge>
                  </div>
                )}

                {selectedVoucher && !usePackage && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">优惠券</h3>
                    <p className="text-sm text-slate-900">
                      {selectedVoucher.voucher?.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* 备注 */}
            <Card>
              <div className="p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="特殊要求或备注..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={3}
                />
              </div>
            </Card>

            {/* 价格明细 */}
            <Card>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">原价</span>
                  <span className="text-slate-900">{formatCurrency(original)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">优惠</span>
                    <span className="text-green-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {usePackage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">套餐抵扣</span>
                    <span className="text-green-600">-{formatCurrency(original)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-slate-900">应付金额</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(final)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {step < 4 ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleNext}
              disabled={
                (step === 1 && !selectedString) ||
                (step === 2 && (!tension || tension < 18 || tension > 30))
              }
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            >
              {loading ? '提交中...' : `确认预约 ${formatCurrency(final)}`}
            </Button>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
