/**
 * 预约流程主组件 (Booking Flow)
 * 
 * 整合所有子组件，处理订单创建流程
 * 步骤：选择球线 → 输入拉力 → 套餐/优惠券 → 确认下单
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, Toast, Checkbox } from '@/components';
import { useSession } from 'next-auth/react';
import PageLoading from '@/components/loading/PageLoading';
import StringSelector from '@/features/booking/StringSelector';
import TensionInput from '@/features/booking/TensionInput';
import VoucherSelector from '@/features/booking/VoucherSelector';
import { StickySelectionBar } from '@/features/booking/components';
import { StringInventory, UserVoucher } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { hasAvailablePackage } from '@/services/packageService';
import { calculateDiscount } from '@/services/voucherService';
import { createOrder } from '@/services/orderService';
import { getUserStats, type MembershipTierInfo } from '@/services/profileService';
import PageHeader from '@/components/layout/PageHeader';

export default function BookingFlow() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';
  const MIN_TENSION_DIFF = 0;
  const MAX_TENSION_DIFF = 3;

  // 订单状态
  const [selectedString, setSelectedString] = useState<StringInventory | null>(null);
  const [tension, setTension] = useState<number | null>(null);
  const [crossTension, setCrossTension] = useState<number | null>(null);
  const [usePackage, setUsePackage] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
  const [notes, setNotes] = useState('');
  const [recommendedTension, setRecommendedTension] = useState<number | null>(null);

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
  const [membershipInfo, setMembershipInfo] = useState<MembershipTierInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 页面进入动画
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

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

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const statsData = await getUserStats();
        if (active) {
          setMembershipInfo(statsData.membership);
        }
      } catch (error) {
        console.error('Failed to load membership info:', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const checkPackageAvailability = async () => {
    const available = await hasAvailablePackage();
    setPackageAvailable(available);
  };

  /**
   * 计算价格
   */
  const calculatePrice = () => {
    if (!selectedString) return { original: 0, discount: 0, membershipDiscount: 0, final: 0 };

    const original = Number(selectedString.sellingPrice) || 0;
    let discount = 0;

    // 如果使用优惠券
    if (selectedVoucher && !usePackage) {
      discount = calculateDiscount(selectedVoucher, original);
    }

    const membershipRate = membershipInfo?.discountRate ?? 0;
    const membershipBase = Math.max(0, original - discount);
    const membershipDiscount =
      !usePackage && membershipRate > 0
        ? (membershipBase * membershipRate) / 100
        : 0;

    const final = usePackage ? 0 : Math.max(0, membershipBase - membershipDiscount);

    return { original, discount, membershipDiscount, final };
  };

  const { original, discount, membershipDiscount, final } = calculatePrice();

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
      } else if (crossTension && crossTension !== tension) {
        const diff = crossTension - tension;
        if (diff < MIN_TENSION_DIFF || diff > MAX_TENSION_DIFF) {
          newErrors.tension = `竖/横差磅需在 ${MIN_TENSION_DIFF}-${MAX_TENSION_DIFF} 磅之间`;
        }
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
    if (crossTension && crossTension !== tension) {
      const diff = crossTension - tension;
      if (diff < MIN_TENSION_DIFF || diff > MAX_TENSION_DIFF) {
        setToast({
          show: true,
          message: `竖/横差磅需在 ${MIN_TENSION_DIFF}-${MAX_TENSION_DIFF} 磅之间`,
          type: 'warning',
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 创建订单
      const membershipDiscountTotal = membershipDiscount;
      const finalNotes = tension === crossTension
        ? notes
        : `[竖/横分拉: ${tension}/${crossTension} LBS] ${notes}`;

      const orderData = {
        stringId: selectedString.id,
        tension,
        price: Number(selectedString.sellingPrice),
        costPrice: Number(selectedString.costPrice),
        discountAmount: discount + membershipDiscountTotal,
        finalPrice: final,
        usePackage: usePackage,
        voucherId: selectedVoucher?.voucher?.id || null,
        notes: finalNotes,
      };

      const order = await createOrder(orderData);

      if (!order) {
        throw new Error('订单创建失败');
      }

      // 成功提示
      setToast({
        show: true,
        message: '预约成功！',
        type: 'success',
      });

      // 如果使用套餐，直接跳转到订单详情
      if (usePackage) {
        setTimeout(() => {
          router.push(`/orders/${order.id}`);
        }, 1500);
      } else {
        // 否则跳转到支付页面
        setTimeout(() => {
          router.push(`/orders/${order.id}`);
        }, 1500);
      }
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
    return <PageLoading surface="dark" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink">
      <PageHeader
        title="立即预约"
        subtitle={`步骤 ${step}/4`}
        onBack={() => step === 1 ? router.push('/') : handleBack()}
      />

      {/* 主内容区 */}
      <div className={`
        max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* 进度指示器 - 优化视觉重量 */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${num < step
                  ? 'bg-accent text-white shadow-md'
                  : num === step
                    ? 'bg-accent text-white shadow-glow ring-4 ring-accent/15 scale-110'
                    : 'bg-ink-surface text-text-tertiary border border-border-subtle'
                  }`}
              >
                {num < step ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              {num < 4 && (
                <div
                  className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500 ${num < step ? 'bg-accent' : 'bg-ink-surface'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* 步骤 1: 选择球线 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">选择球线</h2>
            <StringSelector
              selectedString={selectedString}
              onSelect={setSelectedString}
              onNext={handleNext}
            />
          </div>
        )}

        {/* 步骤 2: 输入拉力 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4">设置拉力</h2>
            <TensionInput
              tension={tension}
              crossTension={crossTension}
              onTensionChange={(v, h) => {
                setTension(v);
                setCrossTension(h);
              }}
              recommendedTension={recommendedTension}
              error={errors.tension}
            />
          </div>
        )}

        {/* 步骤 3: 选择优惠 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary mb-4">选择优惠</h2>

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
                  <p className="text-xs text-text-tertiary mt-2 ml-6">
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
            <h2 className="text-xl font-bold text-text-primary mb-4">确认订单</h2>

            {/* 订单摘要 - 极致纯白卡片 */}
            <Card variant="elevated" className="border-border-subtle hover:shadow-md transition-shadow">
              <div className="p-5 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-text-tertiary mb-1.5 opacity-80">球线信息</h3>
                    <p className="font-bold text-text-primary text-base leading-tight">
                      {selectedString?.brand} {selectedString?.model}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1 font-medium italic">
                      {selectedString?.specification}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-text-tertiary mb-1.5 opacity-80">设置拉力</h3>
                    <p className="font-black text-accent text-lg">
                      {tension === crossTension ? `${tension} LBS` : `${tension}/${crossTension} LBS`}
                    </p>
                    {tension !== crossTension && (
                      <p className="text-[10px] text-text-tertiary font-bold mt-0.5">竖 / 横 分拉</p>
                    )}
                  </div>
                </div>

                {/* 优惠与标签 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {usePackage ? (
                    <Badge variant="success" className="bg-success/10 text-success border-none font-bold px-3 py-1">使用套餐抵扣</Badge>
                  ) : selectedVoucher ? (
                    <Badge variant="warning" className="bg-accent/10 text-accent border-none font-bold px-3 py-1">已用：{selectedVoucher.voucher?.name || '优惠券'}</Badge>
                  ) : null}
                  {membershipInfo && membershipInfo.discountRate > 0 && !usePackage && (
                    <Badge variant="info" className="bg-info/10 text-info border-none font-bold px-3 py-1">{membershipInfo.label}额外优惠</Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* 备注 - 统一白净样式 */}
            <Card variant="elevated" className="border-border-subtle">
              <div className="p-5">
                <label className="block text-[10px] uppercase tracking-widest font-black text-text-tertiary mb-3 opacity-80">
                  特殊备注 (可选)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="有什么需要特别叮嘱穿线师的吗？"
                  className="w-full px-4 py-3 border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 bg-ink-surface/30 text-text-primary placeholder:text-text-tertiary text-sm transition-all focus:bg-white"
                  rows={3}
                />
              </div>
            </Card>

            {/* 价格明细 - 极致纯白卡片 */}
            <Card variant="elevated" className="border-border-subtle shadow-md">
              <div className="p-5 space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-tertiary font-medium">项目原价</span>
                  <span className="text-text-primary font-bold">{formatCurrency(original)}</span>
                </div>
                {!usePackage && membershipDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-tertiary font-medium">{membershipInfo?.label || '会员折扣'}</span>
                      <span className="text-[10px] bg-info/10 text-info px-1.5 py-0.5 rounded font-bold">-{membershipInfo?.discountRate}%</span>
                    </div>
                    <span className="text-info font-bold">
                      -{formatCurrency(membershipDiscount)}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary font-medium">代金券/优惠券</span>
                    <span className="text-accent font-bold">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {usePackage && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary font-medium">套餐权益抵扣</span>
                    <span className="text-success font-bold">-{formatCurrency(original)}</span>
                  </div>
                )}

                <div className="border-t border-border-subtle/50 pt-4 mt-1 flex justify-between items-center">
                  <div>
                    <span className="font-black text-text-primary text-base">应付总额</span>
                    {final > 0 && !usePackage && (
                      <p className="text-[10px] text-text-tertiary font-bold mt-0.5 opacity-60">已包含所有优惠</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-accent tracking-tighter">
                      {formatCurrency(final)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 底部操作栏 - 统一使用 StickySelectionBar 样式以保持连贯性 */}
      {step === 2 && (
        <StickySelectionBar
          selectedString={selectedString}
          onClearSelection={() => {
            setSelectedString(null);
            setStep(1);
          }}
          onNext={handleNext}
        />
      )}

      {step > 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border-subtle safe-area-pb z-20">
          <div className="max-w-2xl mx-auto px-6 py-5">
            {step < 4 ? (
              <Button
                variant="primary"
                fullWidth
                onClick={handleNext}
                className="h-12 text-base font-black rounded-xl shadow-glow"
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
                className="h-12 text-base font-black rounded-xl shadow-glow"
              >
                {loading ? '正在提交...' : `确认预约 · ${formatCurrency(final)}`}
              </Button>
            )}
          </div>
        </div>
      )}

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
