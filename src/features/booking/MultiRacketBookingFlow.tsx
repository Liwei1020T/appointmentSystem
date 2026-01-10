/**
 * 多球拍预约流程组件 (Multi-Racket Booking Flow)
 * 
 * 支持在单个订单中添加多支球拍，每支球拍可选择不同的球线和磅数
 * 采用购物车模式：选择球线 → 添加到购物车 → 配置每支球拍 → 选择优惠 → 确认订单
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, ShoppingCart, ArrowRight, ArrowLeft, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { StringInventory, UserVoucher } from '@/types';
import PageLoading from '@/components/loading/PageLoading';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { hasAvailablePackage, getUserPackages } from '@/services/packageService';
import { createMultiRacketOrder, getOrderById } from '@/services/orderService';
import { getUserStats, getUserProfile, type MembershipTierInfo } from '@/services/profileService';
import StringSelector from './StringSelector';
import RacketItemCard, { RacketItemData } from './RacketItemCard';
import VoucherSelector from './VoucherSelector';
import ServiceMethodSelector, { ServiceType } from './ServiceMethodSelector';
import { toast } from 'sonner';

// 生成临时 ID
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export default function MultiRacketBookingFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const user = session?.user;
    const isAuthenticated = !!session;
    const authLoading = status === 'loading';
    const MIN_TENSION_DIFF = 0;
    const MAX_TENSION_DIFF = 3;

    // 购物车状态
    const [cartItems, setCartItems] = useState<RacketItemData[]>([]);
    const [selectedStringForAdd, setSelectedStringForAdd] = useState<StringInventory | null>(null);

    // 优惠相关
    const [usePackage, setUsePackage] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);
    const [notes, setNotes] = useState('');

    // 服务方式
    const [serviceType, setServiceType] = useState<ServiceType>('in_store');
    const [pickupAddress, setPickupAddress] = useState('');
    const [userDefaultAddress, setUserDefaultAddress] = useState('');

    // 复单状态
    const repeatOrderId = searchParams.get('repeatOrderId');
    const [repeatLoaded, setRepeatLoaded] = useState(false);
    const [repeatSourceLabel, setRepeatSourceLabel] = useState<string | null>(null);

    // UI 状态
    const [step, setStep] = useState(1); // 1: 选择球线添加, 2: 配置球拍, 3: 优惠/套餐, 4: 确认
    const [isCartExpanded, setIsCartExpanded] = useState(false); // 购物车预览折叠状态
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [packageAvailable, setPackageAvailable] = useState(false);
    const [userPackages, setUserPackages] = useState<any[]>([]);
    const [membershipInfo, setMembershipInfo] = useState<MembershipTierInfo | null>(null);
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [syncTension, setSyncTension] = useState(true);
    const [syncNotes, setSyncNotes] = useState(false);
    const [overwriteNotes, setOverwriteNotes] = useState(false);
    const [toastState, setToastState] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({ show: false, message: '', type: 'info' });
    const racketCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // 页面进入动画
    useEffect(() => {
        if (!authLoading) {
            const timer = setTimeout(() => setIsVisible(true), 150);
            return () => clearTimeout(timer);
        }
    }, [authLoading]);

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
            loadUserAddress();
        }
    }, [user]);

    useEffect(() => {
        if (repeatOrderId) {
            setRepeatLoaded(false);
            setRepeatSourceLabel(null);
        }
    }, [repeatOrderId]);

    useEffect(() => {
        if (cartItems.length === 0) {
            if (templateId !== null) {
                setTemplateId(null);
            }
            return;
        }
        if (!templateId || !cartItems.some((item) => item.id === templateId)) {
            setTemplateId(cartItems[0].id);
        }
    }, [cartItems, templateId]);

    const loadUserAddress = async () => {
        try {
            const { profile } = await getUserProfile();
            if (profile?.address) {
                setUserDefaultAddress(profile.address);
            }
        } catch (error) {
            console.error('Failed to load user address:', error);
        }
    };

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

    /**
     * Scroll to a specific racket card to help users resolve validation issues.
     * @param racketId - The rackets's temporary ID.
     */
    const scrollToRacketCard = useCallback((racketId: string) => {
        const target = racketCardRefs.current[racketId];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    /**
     * Determine whether a racket item is fully configured.
     * @param item - Racket item data for validation.
     * @returns True when required data is complete and tension diff is valid.
     */
    const isRacketComplete = useCallback((item: RacketItemData) => {
        const diff = item.tensionHorizontal - item.tensionVertical;
        return Boolean(item.racketPhoto) && diff >= MIN_TENSION_DIFF && diff <= MAX_TENSION_DIFF;
    }, [MIN_TENSION_DIFF, MAX_TENSION_DIFF]);

    /**
     * Summary stats for the Step 2 checklist panel.
     * @returns Counts for completed and outstanding items, plus the first incomplete ID.
     */
    const completionStats = useMemo(() => {
        const total = cartItems.length;
        let completeCount = 0;
        let missingPhotoCount = 0;
        let invalidDiffCount = 0;
        let firstIncompleteId: string | null = null;

        cartItems.forEach((item) => {
            const hasPhoto = Boolean(item.racketPhoto);
            const diff = item.tensionHorizontal - item.tensionVertical;
            const diffValid = diff >= MIN_TENSION_DIFF && diff <= MAX_TENSION_DIFF;
            const complete = hasPhoto && diffValid;

            if (complete) {
                completeCount += 1;
                return;
            }

            if (!firstIncompleteId) {
                firstIncompleteId = item.id;
            }
            if (!hasPhoto) {
                missingPhotoCount += 1;
            }
            if (!diffValid) {
                invalidDiffCount += 1;
            }
        });

        return {
            total,
            completeCount,
            missingPhotoCount,
            invalidDiffCount,
            firstIncompleteId,
        };
    }, [cartItems, MIN_TENSION_DIFF, MAX_TENSION_DIFF]);

    const buildItemsFromOrder = useCallback((order: any): RacketItemData[] => {
        const orderItems = Array.isArray(order.items) ? order.items : [];
        if (orderItems.length > 0) {
            return orderItems.map((item: any) => ({
                id: generateTempId(),
                stringId: item.stringId || item.string_id || item.string?.id || order.stringId || order.string_id || '',
                string: {
                    id: item.string?.id || item.stringId || item.string_id || order.stringId || order.string_id || '',
                    brand: item.string?.brand || order.string?.brand || '',
                    model: item.string?.model || order.string?.model || '',
                    sellingPrice: item.string?.sellingPrice || order.string?.sellingPrice || order.finalPrice || order.final_price || order.price || 0,
                },
                tensionVertical: item.tensionVertical ?? item.tension_vertical ?? order.tension ?? 24,
                tensionHorizontal: item.tensionHorizontal ?? item.tension_horizontal ?? order.tension ?? 24,
                racketBrand: item.racketBrand ?? item.racket_brand ?? '',
                racketModel: item.racketModel ?? item.racket_model ?? '',
                racketPhoto: item.racketPhoto ?? item.racket_photo ?? '',
                notes: item.notes ?? '',
            }));
        }

        const fallbackStringId = order.stringId || order.string_id || order.string?.id || '';
        if (!fallbackStringId) return [];

        const fallbackTension = Number(order.tension) || 24;
        return [
            {
                id: generateTempId(),
                stringId: fallbackStringId,
                string: {
                    id: fallbackStringId,
                    brand: order.string?.brand || order.stringBrand || order.string_brand || '',
                    model: order.string?.model || order.stringName || order.string_name || '',
                    sellingPrice: order.string?.sellingPrice || order.finalPrice || order.final_price || order.price || 0,
                },
                tensionVertical: fallbackTension,
                tensionHorizontal: fallbackTension,
                racketPhoto: '',
                notes: order.notes ?? '',
            },
        ];
    }, []);

    useEffect(() => {
        if (!user || !repeatOrderId || repeatLoaded) return;

        let active = true;
        (async () => {
            try {
                const order = await getOrderById(repeatOrderId);
                if (!active) return;

                const nextItems = buildItemsFromOrder(order);
                if (nextItems.length === 0) {
                    throw new Error('Missing order items');
                }

                setCartItems(nextItems);
                setSelectedStringForAdd(null);
                setIsCartExpanded(true);
                setStep(2);
                setNotes(order.notes || '');
                setUsePackage(false);
                setSelectedPackageId(null);
                setSelectedVoucher(null);
                setServiceType(order.serviceType || order.service_type || 'in_store');
                setPickupAddress(order.pickupAddress || order.pickup_address || '');
                setRepeatSourceLabel(`订单 #${order.id.slice(0, 6).toUpperCase()}`);
                toast.success('已载入上次配置');
            } catch (error) {
                if (active) {
                    toast.error('未能载入上次配置');
                }
            } finally {
                if (active) {
                    setRepeatLoaded(true);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [user, repeatOrderId, repeatLoaded, buildItemsFromOrder]);

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

    /**
     * Apply template values to all other rackets in the cart.
     * @param options - Flags for which fields to apply.
     * @returns True when updates were applied.
     */
    const applyTemplateToItems = useCallback((options: {
        applyTension: boolean;
        applyNotes: boolean;
        overwriteNotes?: boolean;
    }) => {
        if (cartItems.length < 2) {
            toast.error('至少需要两支球拍才能快速配置');
            return false;
        }
        if (!options.applyTension && !options.applyNotes) {
            toast.error('请选择要同步的内容');
            return false;
        }

        const source = cartItems.find((item) => item.id === templateId) || cartItems[0];
        if (!source) {
            toast.error('未找到模板球拍');
            return false;
        }
        const sourceNotes = (source.notes || '').trim();
        const shouldApplyNotes = options.applyNotes && sourceNotes.length > 0;

        if (options.applyNotes && !sourceNotes) {
            toast.error('模板备注为空，已跳过同步备注');
            if (!options.applyTension) {
                return false;
            }
        }

        setCartItems(prev => prev.map((item) => {
            if (item.id === source.id) return item;
            const updates: Partial<RacketItemData> = {};
            if (options.applyTension) {
                updates.tensionVertical = source.tensionVertical;
                updates.tensionHorizontal = source.tensionHorizontal;
            }
            if (shouldApplyNotes) {
                if (!options.overwriteNotes && item.notes) {
                    return item;
                }
                updates.notes = sourceNotes;
            }
            return Object.keys(updates).length > 0 ? { ...item, ...updates } : item;
        }));

        return true;
    }, [cartItems, templateId]);

    /**
     * Apply selected template settings based on the current sync options.
     */
    const handleQuickApply = useCallback(() => {
        const applied = applyTemplateToItems({
            applyTension: syncTension,
            applyNotes: syncNotes,
            overwriteNotes,
        });
        if (applied) {
            toast.success('已同步配置到其余球拍');
        }
    }, [applyTemplateToItems, overwriteNotes, syncNotes, syncTension]);

    /**
     * Apply only tension values from the template to all other rackets.
     */
    const handleApplyTensionOnly = useCallback(() => {
        const applied = applyTemplateToItems({
            applyTension: true,
            applyNotes: false,
        });
        if (applied) {
            toast.success('已同步拉力到其余球拍');
        }
    }, [applyTemplateToItems]);

    /**
     * Clear notes for every racket in the cart.
     */
    const handleClearNotes = useCallback(() => {
        if (cartItems.length === 0) {
            toast.error('暂无备注可清空');
            return;
        }
        setCartItems(prev => prev.map(item => ({ ...item, notes: '' })));
        toast.success('已清空全部备注');
    }, [cartItems.length]);

    // 计算价格
    const calculatePrices = useCallback(() => {
        const baseTotal = cartItems.reduce((sum, item) => {
            const price = typeof item.string.sellingPrice === 'object'
                ? item.string.sellingPrice.toNumber()
                : Number(item.string.sellingPrice);
            return sum + price;
        }, 0);

        // 如果使用套餐，总价为 0
        if (usePackage) {
            return { baseTotal, voucherDiscount: 0, membershipDiscount: 0, totalDiscount: baseTotal, finalTotal: 0 };
        }

        // 优惠券折扣
        let voucherDiscount = 0;
        if (selectedVoucher?.voucher) {
            const voucher = selectedVoucher.voucher;
            const discountType = (voucher as any).type || (voucher as any).discount_type;
            const discountValue = Number((voucher as any).value || (voucher as any).discount_value || 0);
            if (discountType === 'percentage') {
                voucherDiscount = (baseTotal * discountValue) / 100;
            } else {
                voucherDiscount = discountValue;
            }
            voucherDiscount = Math.min(voucherDiscount, baseTotal);
        }

        // 会员折扣（基于优惠券折扣后的金额）
        const membershipDiscountRate = membershipInfo?.discountRate || 0;
        const afterVoucherTotal = baseTotal - voucherDiscount;
        const membershipDiscount = membershipDiscountRate > 0
            ? afterVoucherTotal * (membershipDiscountRate / 100)
            : 0;

        const totalDiscount = voucherDiscount + membershipDiscount;
        const finalTotal = Math.max(0, baseTotal - totalDiscount);

        return { baseTotal, voucherDiscount, membershipDiscount, totalDiscount, finalTotal };
    }, [cartItems, usePackage, selectedVoucher, membershipInfo]);

    const { baseTotal, voucherDiscount, membershipDiscount, totalDiscount, finalTotal } = calculatePrices();


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
                scrollToRacketCard(item.id);
                return false;
            }
            const diff = item.tensionHorizontal - item.tensionVertical;
            if (diff < MIN_TENSION_DIFF || diff > MAX_TENSION_DIFF) {
                toast.error(`第 ${i + 1} 支球拍差磅需在 ${MIN_TENSION_DIFF}-${MAX_TENSION_DIFF} 磅之间`);
                scrollToRacketCard(item.id);
                return false;
            }
        }

        return true;
    }, [cartItems, MAX_TENSION_DIFF, MIN_TENSION_DIFF, scrollToRacketCard]);

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
            const result = await createMultiRacketOrder({
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
                serviceType,
                pickupAddress: serviceType === 'pickup_delivery' ? pickupAddress : undefined,
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
    const allItemsComplete = cartItems.every(item => isRacketComplete(item));
    const quickApplySource = cartItems.find((item) => item.id === templateId) || cartItems[0];
    const templateIndex = quickApplySource
        ? Math.max(1, cartItems.findIndex((item) => item.id === quickApplySource.id) + 1)
        : 0;
    const incompleteCount = Math.max(0, completionStats.total - completionStats.completeCount);

    if (authLoading) {
        return <PageLoading />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-ink">
            {/* 顶部导航栏 - 与 PageHeader 统一 */}
            <div className="bg-white/90 backdrop-blur-md sticky top-[64px] z-30 border-b border-border-subtle shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
                    <button
                        onClick={() => step === 1 ? router.push('/') : handleBack()}
                        className="w-10 h-10 flex items-center justify-center bg-ink hover:bg-ink/80 rounded-xl transition-colors shrink-0"
                        aria-label="返回"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-text-primary truncate">预约穿线</h1>
                        <p className="text-sm text-text-secondary mt-0.5 truncate">
                            步骤 {step}/4 · {cartItems.length} 支球拍
                        </p>
                    </div>
                    {/* 购物车徽章 */}
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6 text-text-secondary" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-text-onAccent text-xs font-bold rounded-full flex items-center justify-center">
                                {cartItems.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {repeatSourceLabel && (
                <div className="max-w-2xl mx-auto px-4 pt-4">
                    <div className="flex items-start gap-3 rounded-xl bg-accent/10 border border-accent/20 p-3">
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-accent" />
                        <div>
                            <p className="text-sm font-semibold text-accent">已载入上次配置</p>
                            <p className="text-xs text-text-secondary mt-1">来源 {repeatSourceLabel}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 动画包装容器 */}
            <div className={`
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                {/* 进度指示器 - 白色卡片 */}
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="bg-ink-surface rounded-xl p-4 shadow-sm border border-border-subtle">
                        <div className="flex items-center justify-between">
                            {[
                                { num: 1, label: '选择球线' },
                                { num: 2, label: '配置球拍' },
                                { num: 3, label: '优惠' },
                                { num: 4, label: '确认' },
                            ].map(({ num, label }) => (
                                <div key={num} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${num < step
                                                ? 'bg-accent text-text-onAccent'
                                            : num === step
                                                    ? 'bg-accent text-text-onAccent shadow-lg ring-4 ring-accent/20 scale-110'
                                                    : 'bg-ink text-text-tertiary'
                                                }`}
                                        >
                                            {num < step ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : num}
                                        </div>
                                        <span className={`text-[10px] md:text-xs mt-1.5 ${num === step ? 'text-accent font-medium' : 'text-text-tertiary'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {num < 4 && (
                                        <div
                                            className={`flex-1 h-0.5 md:h-1 mx-2 md:mx-3 rounded-full transition-all ${num < step ? 'bg-accent' : 'bg-border-subtle'
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 主内容区 */}
                <div className={`max-w-2xl mx-auto px-4 py-4 space-y-4 ${step === 1 ? 'pb-28' : 'pb-24'}`}>
                    {/* Step 1: 选择球线添加到购物车 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-text-primary">选择球线</h2>
                                {cartItems.length > 0 && (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent text-text-onAccent rounded-lg font-medium hover:bg-accent/90 transition-all"
                                    >
                                        继续配置
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* 已添加的球拍预览 - 浅橙色卡片 */}
                            {cartItems.length > 0 && (
                                <div className="bg-accent/10 rounded-xl border border-accent/20 overflow-hidden">
                                    {/* 折叠头部 */}
                                    <button
                                        onClick={() => setIsCartExpanded(!isCartExpanded)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-accent/15 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-accent text-text-onAccent rounded-full text-xs flex items-center justify-center font-bold">
                                                {cartItems.length}
                                            </span>
                                            <span className="text-sm font-medium text-accent">
                                                已添加 {cartItems.length} 支球拍
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-accent font-mono">
                                                {formatCurrency(baseTotal)}
                                            </span>
                                            {isCartExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-accent" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-accent" />
                                            )}
                                        </div>
                                    </button>

                                    {/* 折叠内容 - 球拍列表 */}
                                    <div className={`overflow-hidden transition-all duration-300 ${isCartExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-3 pb-3 space-y-2">
                                            {cartItems.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-border-subtle"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <span className="text-sm text-text-primary truncate">
                                                            {item.string.brand} {item.string.model}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(item.id);
                                                        }}
                                                        className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-full transition-colors flex-shrink-0"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 球线选择器 - 不再渲染 StickySelectionBar */}
                            <StringSelector
                                selectedString={selectedStringForAdd}
                                onSelect={setSelectedStringForAdd}
                                onNext={() => { }}
                                hideBottomBar={true}
                            />
                        </div>
                    )}

                    {/* Step 2: 配置每支球拍 */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-text-primary">配置球拍</h2>
                                <span className="text-sm text-text-tertiary">
                                    {completionStats.completeCount}/{completionStats.total} 已完成
                                </span>
                            </div>

                            {cartItems.length > 0 && (
                                <div className="rounded-xl border border-border-subtle bg-ink-surface shadow-sm p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-text-tertiary">配置进度</p>
                                            <p className="text-base font-semibold text-text-primary">
                                                {completionStats.completeCount}/{completionStats.total} 已完成
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (completionStats.firstIncompleteId) {
                                                    scrollToRacketCard(completionStats.firstIncompleteId);
                                                }
                                            }}
                                            disabled={!completionStats.firstIncompleteId}
                                            className="px-3 py-2 text-xs font-medium rounded-lg border border-border-subtle text-text-secondary hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            定位未完成
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        {completionStats.completeCount === completionStats.total && (
                                            <span className="px-2.5 py-1 rounded-full bg-success/15 text-success">
                                                全部完成
                                            </span>
                                        )}
                                        {completionStats.missingPhotoCount > 0 && (
                                            <span className="px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                                                缺少照片 {completionStats.missingPhotoCount}
                                            </span>
                                        )}
                                        {completionStats.invalidDiffCount > 0 && (
                                            <span className="px-2.5 py-1 rounded-full bg-danger/10 text-danger">
                                                差磅异常 {completionStats.invalidDiffCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {cartItems.length > 1 && quickApplySource && (
                                <div className="rounded-xl border border-border-subtle bg-white shadow-sm p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">快速配置</p>
                                            <p className="text-xs text-text-tertiary mt-1">
                                                选择模板后同步到其余 {cartItems.length - 1} 支
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium bg-ink px-2 py-1 rounded-full text-text-secondary">
                                            模板 #{templateIndex}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-3 text-xs text-text-secondary">
                                        <div>
                                            <label className="block text-[11px] text-text-tertiary mb-1">模板球拍</label>
                                            <select
                                                value={templateId || quickApplySource.id}
                                                onChange={(event) => setTemplateId(event.target.value)}
                                                className="w-full h-9 rounded-lg border border-border-subtle bg-ink-surface text-text-primary text-xs px-2.5 focus:outline-none focus:ring-2 focus:ring-accent-border"
                                            >
                                                {cartItems.map((item, index) => (
                                                    <option key={item.id} value={item.id}>
                                                        第 {index + 1} 支 · {item.string.brand} {item.string.model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between bg-ink rounded-lg px-3 py-2 border border-border-subtle">
                                            <span>拉力</span>
                                            <span className="font-mono text-text-primary">
                                                {quickApplySource.tensionVertical}/{quickApplySource.tensionHorizontal} 磅
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-ink rounded-lg px-3 py-2 border border-border-subtle">
                                            <span>备注</span>
                                            <span className="text-text-primary truncate max-w-[180px]">
                                                {quickApplySource.notes?.trim() ? quickApplySource.notes : '无'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={syncTension}
                                                onChange={(event) => setSyncTension(event.target.checked)}
                                                className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-2 focus:ring-accent-border"
                                            />
                                            <span>同步拉力</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={syncNotes}
                                                onChange={(event) => {
                                                    const nextValue = event.target.checked;
                                                    setSyncNotes(nextValue);
                                                    if (!nextValue) {
                                                        setOverwriteNotes(false);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-2 focus:ring-accent-border"
                                            />
                                            <span>同步备注</span>
                                        </label>
                                        {syncNotes && (
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={overwriteNotes}
                                                    onChange={(event) => setOverwriteNotes(event.target.checked)}
                                                    className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-2 focus:ring-accent-border"
                                                />
                                                <span>覆盖已有备注</span>
                                            </label>
                                        )}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={handleApplyTensionOnly}
                                            className="px-3 py-2 rounded-lg border border-border-subtle bg-ink text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                                        >
                                            仅同步拉力
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearNotes}
                                            className="px-3 py-2 rounded-lg border border-danger/30 text-danger bg-danger/10 hover:bg-danger/15 transition-colors"
                                        >
                                            清空全部备注
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleQuickApply}
                                        disabled={!syncTension && !syncNotes}
                                        className="mt-4 w-full px-4 py-3 rounded-xl bg-accent text-text-onAccent font-semibold hover:bg-accent/90 transition-all disabled:opacity-50"
                                    >
                                        应用到其余 {cartItems.length - 1} 支
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                {cartItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        ref={(node) => {
                                            racketCardRefs.current[item.id] = node;
                                        }}
                                        className={`scroll-mt-28 rounded-xl transition-shadow ${templateId === item.id ? 'ring-1 ring-accent/30' : ''}`}
                                    >
                                        <RacketItemCard
                                            item={item}
                                            index={index}
                                            onUpdate={handleUpdateItem}
                                            onRemove={handleRemoveItem}
                                            disabled={loading}
                                            isTemplate={templateId === item.id}
                                            onSetTemplate={() => setTemplateId(item.id)}
                                        />
                                    </div>
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
                                        使用套餐
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
                            {membershipInfo && membershipInfo.discountRate > 0 && !usePackage && (
                                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                                    <p className="text-sm text-accent font-medium">
                                        {membershipInfo.label} 会员专享 {membershipInfo.discountRate}% 折扣
                                    </p>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Step 4: 确认订单 */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-text-primary">确认订单</h2>

                            {/* 服务方式选择 */}
                            <div className="bg-ink-surface rounded-xl border border-border-subtle shadow-sm p-4">
                                <ServiceMethodSelector
                                    value={serviceType}
                                    onChange={setServiceType}
                                    pickupAddress={pickupAddress}
                                    onAddressChange={setPickupAddress}
                                    defaultAddress={userDefaultAddress}
                                    disabled={loading}
                                />
                            </div>

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
                                {voucherDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-success">优惠券折扣</span>
                                        <span className="text-success">-{formatCurrency(voucherDiscount)}</span>
                                    </div>
                                )}
                                {membershipDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-accent">会员折扣 ({membershipInfo?.discountRate}%)</span>
                                        <span className="text-accent">-{formatCurrency(membershipDiscount)}</span>
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
            </div>

            {/* 底部操作栏 - Step 1: 统一底部栏 */}
            {step === 1 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-subtle shadow-lg z-50 safe-area-pb">
                    <div className="max-w-2xl mx-auto px-4 py-3">
                        {selectedStringForAdd ? (
                            /* 已选中球线 */
                            <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {selectedStringForAdd.brand} {selectedStringForAdd.model}
                                    </p>
                                    <p className="text-lg font-bold text-accent font-mono">
                                        {formatCurrency(Number(selectedStringForAdd.sellingPrice) || Number(selectedStringForAdd.selling_price) || 0)}
                                    </p>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold hover:shadow-glow transition-all active:scale-[0.98]"
                                >
                                    <Plus className="w-5 h-5" />
                                    添加
                                </button>
                            </div>
                        ) : (
                            /* 未选中状态 */
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-text-tertiary">请选择一款球线</p>
                                <button
                                    disabled
                                    className="px-6 py-3 bg-ink text-text-tertiary rounded-xl font-bold cursor-not-allowed border border-border-subtle"
                                >
                                    下一步
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 底部操作栏 - Step 2-4 */}
            {step > 1 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-subtle p-4 shadow-lg z-50">
                    <div className="max-w-2xl mx-auto flex flex-col gap-3">
                        <div className="flex items-start justify-between text-xs">
                            <div className="flex flex-col gap-1 text-text-tertiary">
                                <span>{cartItems.length} 支球拍 · 预计实付</span>
                                {step === 2 && !allItemsComplete && (
                                    <div className="flex items-center gap-2 text-warning">
                                        <span>还有 {incompleteCount} 支未完成</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (completionStats.firstIncompleteId) {
                                                    scrollToRacketCard(completionStats.firstIncompleteId);
                                                }
                                            }}
                                            disabled={!completionStats.firstIncompleteId}
                                            className="px-2 py-0.5 rounded-md border border-warning/30 text-warning hover:bg-warning/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            定位
                                        </button>
                                    </div>
                                )}
                            </div>
                            <span className="font-semibold text-text-primary">
                                {formatCurrency(finalTotal)}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl border border-border-subtle text-text-secondary font-medium hover:bg-ink transition-colors disabled:opacity-50"
                            >
                                返回
                            </button>
                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={loading || (step === 2 && !allItemsComplete)}
                                    className="flex-1 py-3 bg-accent text-text-onAccent rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                                >
                                    下一步
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-accent text-text-onAccent rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <LoadingSpinner size="sm" tone="inverse" />
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
                </div>
            )}
        </div>
    );
}
