/**
 * 多球拍预约流程组件 (Multi-Racket Booking Flow)
 * 
 * 支持在单个订单中添加多支球拍，每支球拍可选择不同的球线和磅数
 * 采用购物车模式：选择球线 → 添加到购物车 → 配置每支球拍 → 选择优惠 → 确认订单
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, ShoppingCart, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { StringInventory, UserVoucher } from '@/types';
import { Spinner } from '@/components';
import { formatCurrency } from '@/lib/utils';
import { hasAvailablePackage, getUserPackages } from '@/services/packageService';
import { createMultiRacketOrderAction } from '@/actions/orders.actions';
import { getUserStats, type MembershipTierInfo } from '@/services/profileService';
import StringSelector from './StringSelector';
import RacketItemCard, { RacketItemData } from './RacketItemCard';
import VoucherSelector from './VoucherSelector';
import { toast } from 'sonner';

// 生成临时 ID
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export default function MultiRacketBookingFlow() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const user = session?.user;
    const isAuthenticated = !!session;
    const authLoading = status === 'loading';

    // 购物车状态
    const [cartItems, setCartItems] = useState<RacketItemData[]>([]);
    const [selectedStringForAdd, setSelectedStringForAdd] = useState<StringInventory | null>(null);

    // 优惠相关
    const [usePackage, setUsePackage] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
    const [notes, setNotes] = useState('');

    // UI 状态
    const [step, setStep] = useState(1); // 1: 选择球线添加, 2: 配置球拍, 3: 优惠/套餐, 4: 确认
    const [loading, setLoading] = useState(false);
    const [packageAvailable, setPackageAvailable] = useState(false);
    const [userPackages, setUserPackages] = useState<any[]>([]);
    const [membershipInfo, setMembershipInfo] = useState<MembershipTierInfo | null>(null);
    const [toastState, setToastState] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({ show: false, message: '', type: 'info' });

    // 如果未登录，跳转到登录页
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // 检查用户是否有可用套餐
    useEffect(() => {
        if (user) {
            checkPackageAvailability();
            loadUserPackages();
            loadMembershipInfo();
        }
    }, [user]);

    const checkPackageAvailability = async () => {
        const available = await hasAvailablePackage();
        setPackageAvailable(available);
    };

    const loadUserPackages = async () => {
        try {
            const result = await getUserPackages();
            const packages = result.data || [];
            setUserPackages(packages.filter((p: any) => p.status === 'active' && p.remaining > 0));
        } catch (error) {
            console.error('Failed to load packages:', error);
        }
    };

    const loadMembershipInfo = async () => {
        try {
            const statsData = await getUserStats();
            setMembershipInfo(statsData.membership);
        } catch (error) {
            console.error('Failed to load membership info:', error);
        }
    };

    // 添加球拍到购物车
    const handleAddToCart = useCallback(() => {
        if (!selectedStringForAdd) return;

        const newItem: RacketItemData = {
            id: generateTempId(),
            stringId: selectedStringForAdd.id,
            string: {
                id: selectedStringForAdd.id,
                brand: selectedStringForAdd.brand,
                model: selectedStringForAdd.model,
                sellingPrice: selectedStringForAdd.sellingPrice || selectedStringForAdd.selling_price || 0,
            },
            tensionVertical: 26,
            tensionHorizontal: 26,
            racketPhoto: '',
            racketBrand: '',
            racketModel: '',
            notes: '',
        };

        setCartItems(prev => [...prev, newItem]);
        setSelectedStringForAdd(null);
        toast.success(`已添加 ${selectedStringForAdd.brand} ${selectedStringForAdd.model}`);
    }, [selectedStringForAdd]);

    // 更新购物车项
    const handleUpdateItem = useCallback((id: string, data: Partial<RacketItemData>) => {
        setCartItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...data } : item
        ));
    }, []);

    // 移除购物车项
    const handleRemoveItem = useCallback((id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // 计算价格
    const calculatePrices = useCallback(() => {
        const baseTotal = cartItems.reduce((sum, item) => {
            const price = typeof item.string.sellingPrice === 'object'
                ? item.string.sellingPrice.toNumber()
                : Number(item.string.sellingPrice);
            return sum + price;
        }, 0);

        let discount = 0;

        // 如果使用套餐，总价为 0
        if (usePackage) {
            return { baseTotal, discount: baseTotal, finalTotal: 0 };
        }

        // 优惠券折扣
        if (selectedVoucher?.voucher) {
            const voucher = selectedVoucher.voucher;
            const discountType = (voucher as any).type || (voucher as any).discount_type;
            const discountValue = Number((voucher as any).value || (voucher as any).discount_value || 0);
            if (discountType === 'percentage') {
                discount = (baseTotal * discountValue) / 100;
            } else {
                discount = discountValue;
            }
            discount = Math.min(discount, baseTotal);
        }

        // 会员折扣
        const membershipDiscountRate = (membershipInfo as any)?.discount || (membershipInfo as any)?.discountPercentage || 0;
        const membershipDiscount = membershipDiscountRate > 0
            ? (baseTotal - discount) * (membershipDiscountRate / 100)
            : 0;

        const totalDiscount = discount + membershipDiscount;
        const finalTotal = Math.max(0, baseTotal - totalDiscount);

        return { baseTotal, discount: totalDiscount, finalTotal };
    }, [cartItems, usePackage, selectedVoucher, membershipInfo]);

    const { baseTotal, discount, finalTotal } = calculatePrices();

    // 验证购物车
    const validateCart = useCallback(() => {
        if (cartItems.length === 0) {
            toast.error('请至少添加一支球拍');
            return false;
        }

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            if (!item.racketPhoto) {
                toast.error(`第 ${i + 1} 支球拍未上传照片`);
                return false;
            }
        }

        return true;
    }, [cartItems]);

    // 验证套餐次数
    const validatePackage = useCallback(() => {
        if (!usePackage || !selectedPackageId) return true;

        const pkg = userPackages.find(p => p.id === selectedPackageId);
        if (!pkg || pkg.remaining < cartItems.length) {
            toast.error(`套餐次数不足，需要 ${cartItems.length} 次`);
            return false;
        }

        return true;
    }, [usePackage, selectedPackageId, userPackages, cartItems.length]);

    // 提交订单
    const handleSubmit = async () => {
        if (!validateCart() || !validatePackage()) return;
        if (!user) return;

        setLoading(true);

        try {
            const result = await createMultiRacketOrderAction({
                items: cartItems.map(item => ({
                    stringId: item.stringId,
                    tensionVertical: item.tensionVertical,
                    tensionHorizontal: item.tensionHorizontal,
                    racketBrand: item.racketBrand,
                    racketModel: item.racketModel,
                    racketPhoto: item.racketPhoto,
                    notes: item.notes,
                })),
                usePackage,
                packageId: selectedPackageId || undefined,
                voucherId: selectedVoucher?.id,
                notes,
            });

            toast.success(`预约成功！共 ${result.racketCount} 支球拍`);

            setTimeout(() => {
                router.push(`/orders/${result.orderId}`);
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || '预约失败，请重试');
            setLoading(false);
        }
    };

    // 步骤导航
    const handleNext = () => {
        if (step === 1 && cartItems.length === 0) {
            toast.error('请先添加球拍到购物车');
            return;
        }
        if (step === 2 && !validateCart()) {
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    // 检查所有球拍是否配置完成
    const allItemsComplete = cartItems.every(item => item.racketPhoto);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-ink flex items-center justify-center">
                <Spinner size="large" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* 顶部导航栏 */}
            <div className="bg-white border-b border-border-subtle sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => step === 1 ? router.push('/') : handleBack()}
                        className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-text-primary">预约穿线</h1>
                        <p className="text-xs text-text-tertiary">
                            步骤 {step}/4 · {cartItems.length} 支球拍
                        </p>
                    </div>
                    {/* 购物车徽章 */}
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6 text-text-secondary" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {cartItems.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 进度指示器 */}
            <div className="max-w-2xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between px-2">
                    {[
                        { num: 1, label: '选择球线' },
                        { num: 2, label: '配置球拍' },
                        { num: 3, label: '优惠' },
                        { num: 4, label: '确认' },
                    ].map(({ num, label }) => (
                        <div key={num} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${num < step
                                        ? 'bg-accent text-white'
                                        : num === step
                                            ? 'bg-accent text-white shadow-glow ring-4 ring-accent/15 scale-110'
                                            : 'bg-ink-surface text-text-tertiary border border-border-subtle'
                                        }`}
                                >
                                    {num < step ? <Check className="w-5 h-5" /> : num}
                                </div>
                                <span className={`text-xs mt-1 ${num === step ? 'text-accent font-medium' : 'text-text-tertiary'}`}>
                                    {label}
                                </span>
                            </div>
                            {num < 4 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${num < step ? 'bg-accent' : 'bg-ink-surface'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 主内容区 */}
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-32">
                {/* Step 1: 选择球线添加到购物车 */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">选择球线</h2>
                            {cartItems.length > 0 && (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:shadow-glow transition-all"
                                >
                                    继续配置
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* 已添加的球拍预览 */}
                        {cartItems.length > 0 && (
                            <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-accent">
                                        已添加 {cartItems.length} 支球拍
                                    </span>
                                    <span className="text-sm font-bold text-accent">
                                        {formatCurrency(baseTotal)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cartItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-border-subtle"
                                        >
                                            <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm text-text-primary">
                                                {item.string.brand} {item.string.model}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-text-tertiary hover:text-danger"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 球线选择器 */}
                        <StringSelector
                            selectedString={selectedStringForAdd}
                            onSelect={setSelectedStringForAdd}
                            onNext={() => { }}
                        />
                    </div>
                )}

                {/* Step 2: 配置每支球拍 */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">配置球拍</h2>
                            <span className="text-sm text-text-tertiary">
                                {cartItems.filter(i => i.racketPhoto).length}/{cartItems.length} 已完成
                            </span>
                        </div>

                        <div className="space-y-4">
                            {cartItems.map((item, index) => (
                                <RacketItemCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onUpdate={handleUpdateItem}
                                    onRemove={handleRemoveItem}
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        {/* 添加更多球拍 */}
                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-3 border-2 border-dashed border-border-subtle rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            添加更多球拍
                        </button>
                    </div>
                )}

                {/* Step 3: 优惠/套餐选择 */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-text-primary">选择优惠</h2>

                        {/* 套餐选择 */}
                        {packageAvailable && userPackages.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-text-primary">
                                    🎁 使用套餐
                                </label>
                                <div className="space-y-2">
                                    {userPackages.map(pkg => (
                                        <label
                                            key={pkg.id}
                                            className={`
                        flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${usePackage && selectedPackageId === pkg.id
                                                    ? 'border-success bg-success/5'
                                                    : 'border-border-subtle hover:border-success/50'
                                                }
                        ${pkg.remaining < cartItems.length ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="package"
                                                    checked={usePackage && selectedPackageId === pkg.id}
                                                    onChange={() => {
                                                        if (pkg.remaining >= cartItems.length) {
                                                            setUsePackage(true);
                                                            setSelectedPackageId(pkg.id);
                                                            setSelectedVoucher(null);
                                                        }
                                                    }}
                                                    disabled={pkg.remaining < cartItems.length}
                                                    className="w-5 h-5 text-success"
                                                />
                                                <div>
                                                    <p className="font-medium text-text-primary">{pkg.package?.name}</p>
                                                    <p className="text-sm text-text-secondary">
                                                        剩余 {pkg.remaining} 次
                                                        {pkg.remaining < cartItems.length && (
                                                            <span className="text-danger ml-2">（不足 {cartItems.length} 次）</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {usePackage && selectedPackageId === pkg.id && (
                                                <span className="text-success font-bold">-{formatCurrency(baseTotal)}</span>
                                            )}
                                        </label>
                                    ))}
                                    {usePackage && (
                                        <button
                                            onClick={() => {
                                                setUsePackage(false);
                                                setSelectedPackageId(null);
                                            }}
                                            className="text-sm text-text-tertiary hover:text-danger"
                                        >
                                            取消使用套餐
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {!usePackage && (
                            <VoucherSelector
                                orderAmount={baseTotal}
                                selectedVoucher={selectedVoucher}
                                onSelect={setSelectedVoucher}
                            />
                        )}

                        {/* 会员折扣提示 */}
                        {(() => {
                            const discountRate = (membershipInfo as any)?.discount || (membershipInfo as any)?.discountPercentage || 0;
                            return membershipInfo && discountRate > 0 && !usePackage && (
                                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                                    <p className="text-sm text-accent font-medium">
                                        🎖️ {membershipInfo.tier} 会员专享 {discountRate}% 折扣
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Step 4: 确认订单 */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-text-primary">确认订单</h2>

                        {/* 订单项列表 */}
                        <div className="space-y-3">
                            {cartItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-ink-surface border border-border-subtle"
                                >
                                    {item.racketPhoto && (
                                        <img
                                            src={item.racketPhoto}
                                            alt="球拍"
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-text-primary">
                                            {item.string.brand} {item.string.model}
                                        </p>
                                        <p className="text-sm text-text-secondary">
                                            {item.tensionVertical}/{item.tensionHorizontal} 磅
                                            {item.racketBrand && ` · ${item.racketBrand}`}
                                            {item.racketModel && ` ${item.racketModel}`}
                                        </p>
                                    </div>
                                    <span className="font-bold text-text-primary">
                                        {usePackage ? '套餐' : formatCurrency(
                                            typeof item.string.sellingPrice === 'object'
                                                ? item.string.sellingPrice.toNumber()
                                                : Number(item.string.sellingPrice)
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 价格汇总 */}
                        <div className="p-4 rounded-xl bg-ink-surface border border-border-subtle space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">球线费用</span>
                                <span className="text-text-primary">{formatCurrency(baseTotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-success">优惠折扣</span>
                                    <span className="text-success">-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            {usePackage && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-success">套餐抵扣 ({cartItems.length} 次)</span>
                                    <span className="text-success">-{formatCurrency(baseTotal)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-border-subtle flex justify-between">
                                <span className="font-bold text-text-primary">实付金额</span>
                                <span className="text-2xl font-black text-accent">
                                    {formatCurrency(finalTotal)}
                                </span>
                            </div>
                        </div>

                        {/* 备注 */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                订单备注（可选）
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="特殊要求或备注..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 底部操作栏 - Step 1: 添加到购物车 */}
            {step === 1 && selectedStringForAdd && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-subtle p-4 shadow-lg z-50">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleAddToCart}
                            className="w-full py-4 bg-accent text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-glow transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            添加 {selectedStringForAdd.brand} {selectedStringForAdd.model}
                        </button>
                    </div>
                </div>
            )}

            {/* 底部操作栏 - Step 2-4 */}
            {step > 1 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-subtle p-4 shadow-lg z-50">
                    <div className="max-w-2xl mx-auto flex gap-3">
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl border border-border-subtle text-text-secondary font-medium hover:bg-ink-elevated transition-colors disabled:opacity-50"
                        >
                            返回
                        </button>
                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading || (step === 2 && !allItemsComplete)}
                                className="flex-1 py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50"
                            >
                                下一步
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="small" />
                                        提交中...
                                    </>
                                ) : (
                                    <>
                                        确认预约
                                        <Check className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
