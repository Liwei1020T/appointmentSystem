/**
 * 套餐中心组件 (Packages Center)
 * 
 * 统一处理套餐购买和查看已购买套餐
 * 设计风格：活力橙 + 玻璃拟态 + 呼吸感设计
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Package as PackageIcon,
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    TrendingDown,
    History,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import {
    getAvailablePackages,
    getUserPackages,
    Package,
    UserPackageWithPackage,
    getPackageUsage,
} from '@/services/packageService';
import { getPendingPackagePaymentsAction } from '@/actions/packages.actions';
import PackageCard from '@/components/PackageCard';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { formatDate, calculateDaysRemaining } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';

// --- 子组件: 购买列表 ---
function PurchaseTab({ isVisible }: { isVisible: boolean }) {
    const router = useRouter();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data, error: err } = await getAvailablePackages();
            if (err) setError(err.message || '加载失败');
            else setPackages(data || []);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl bg-white border border-gray-100 p-6 animate-pulse h-64 shadow-sm" />
            ))}
        </div>
    );

    if (error) return <Card className="p-8 text-center text-red-500 bg-white border border-gray-100 shadow-sm">{error}</Card>;

    if (packages.length === 0) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
                <PackageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无可购买套餐</h3>
            <p className="text-gray-500">敬请期待更多优惠套餐</p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Compact Benefit Banner - 4 Column Icon Grid */}
            <div className={`
                bg-gradient-to-r from-orange-50 to-white rounded-2xl border border-orange-100 p-4
                transition-all duration-500
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">价格更优惠</span>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">随时使用</span>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">无需每次支付</span>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">专属优惠</span>
                    </div>
                </div>
            </div>

            {/* Pricing Cards - 3 Column Grid */}
            <div className={`
                grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 lg:gap-6
                py-4 md:py-6
                transition-all duration-700 delay-200
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}>
                {packages.map((pkg, index) => (
                    <div
                        key={pkg.id}
                        style={{ transitionDelay: `${300 + index * 100}ms` }}
                        className={`
                            transition-all duration-500
                            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                        `}
                    >
                        <PackageCard
                            package={pkg}
                            onPurchase={(p) => router.push(`/packages/purchase?id=${p.id}`)}
                            showSavings
                            averagePrice={50}
                        />
                    </div>
                ))}
            </div>

            {/* Purchase Notes - Simplified */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    购买须知
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-gray-500">
                    <li>• 套餐购买后不支持退款</li>
                    <li>• 有效期内可随时使用</li>
                    <li>• 过期后剩余次数失效</li>
                    <li>• 可在"我的套餐"查看记录</li>
                </ul>
            </div>
        </div>
    );
}

// --- 子组件: 我的套餐 ---
function MyPackagesTab({ isVisible }: { isVisible: boolean }) {
    const router = useRouter();
    const [packages, setPackages] = useState<UserPackageWithPackage[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showExpired, setShowExpired] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<UserPackageWithPackage | null>(null);
    const [usageLogs, setUsageLogs] = useState<any[]>([]);
    const [showUsageHistory, setShowUsageHistory] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data, error: err } = await getUserPackages(false);
                if (err) setError(err.message || '加载失败');
                else setPackages(data || []);

                const p = await getPendingPackagePaymentsAction();
                setPending(p);
            } catch (e: any) {
                setError(e.message || '加载失败');
            }
            setLoading(false);
        };
        load();
    }, []);

    // 获取过期时间（兼容多种字段名）
    const getExpiry = (pkg: any) => pkg.expiry ?? pkg.expiry_date ?? pkg.expires_at ?? pkg.expiresAt ?? null;

    // 检查套餐是否有效
    const isValid = (pkg: UserPackageWithPackage) => {
        if ((pkg as any).remaining <= 0) return false;
        const exp = getExpiry(pkg);
        return !exp || new Date(exp).getTime() > Date.now();
    };

    // 获取天数剩余
    const getDaysRemaining = (expiryDate: string | Date | null) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // 查看使用记录
    const handleViewHistory = async (pkg: UserPackageWithPackage) => {
        setSelectedPackage(pkg);
        try {
            const { usage } = await getPackageUsage(pkg.id);
            setUsageLogs(usage || []);
        } catch (e) {
            setUsageLogs([]);
        }
        setShowUsageHistory(true);
    };

    const current = packages.filter(isValid);
    const expired = packages.filter(p => !isValid(p));
    const activeList = showExpired ? expired : current;
    const totalRemaining = current.reduce((sum, pkg) => sum + ((pkg as any).remaining || 0), 0);

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (error) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
        </div>
    );

    return (
        <div className={`space-y-5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* ========== 统计仪表板 - 双卡片布局 ========== */}
            <div className="grid grid-cols-2 gap-4">
                {/* 剩余总次数卡片 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-500 text-sm mb-1">剩余总次数</p>
                            <p className="text-3xl font-bold text-orange-500" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                {totalRemaining}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 有效套餐卡片 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-500 text-sm mb-1">有效套餐</p>
                            <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                {current.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== 待审核套餐 - 黄色左侧边框样式 ========== */}
            {pending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                        待审核套餐 ({pending.length})
                    </h2>
                    {pending.map((payment) => (
                        <div
                            key={payment.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden"
                        >
                            {/* 黄色左侧边框 */}
                            <div className="flex">
                                <div className="w-1.5 bg-yellow-400 flex-shrink-0" />
                                <div className="flex-1 p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {payment.packageName}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    购买于 {new Date(payment.createdAt).toLocaleDateString('zh-CN')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                            审核中
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">穿线次数</p>
                                            <p className="font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                                {payment.packageTimes} 次
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">有效期</p>
                                            <p className="font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                                {payment.packageValidityDays} 天
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-xs text-gray-500 mb-1">支付金额</p>
                                            <p className="font-bold text-orange-500" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                                RM {payment.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== 切换按钮 - 分段控制器 ========== */}
            {(current.length > 0 || expired.length > 0) && (
                <div className="bg-white rounded-2xl p-1.5 shadow-md border border-gray-100">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowExpired(false)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${!showExpired
                                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            有效套餐 ({current.length})
                        </button>
                        <button
                            onClick={() => setShowExpired(true)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${showExpired
                                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            已过期 ({expired.length})
                        </button>
                    </div>
                </div>
            )}

            {/* ========== 套餐列表 - 现代卡片设计 ========== */}
            {activeList.length > 0 ? (
                <div className="space-y-4">
                    {activeList.map((pkg, index) => {
                        const packageInfo = (pkg as any).package;
                        const remaining = (pkg as any).remaining || 0;
                        const total = packageInfo?.times || remaining;
                        const usedTimes = Math.max(total - remaining, 0);
                        const usagePercentage = total > 0 ? Math.round((usedTimes / total) * 100) : 0;
                        const exp = getExpiry(pkg);
                        const daysRemaining = getDaysRemaining(exp);
                        const isExpired = daysRemaining !== null && daysRemaining < 0;
                        const isSoonExpiring = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

                        return (
                            <div
                                key={pkg.id}
                                className={`bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in ${!isValid(pkg) ? 'opacity-60' : ''}`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* 卡片头部 */}
                                <div className="p-5 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-md flex-shrink-0">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {packageInfo?.name || '套餐'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    购买于 {formatDate((pkg as any).created_at || (pkg as any).createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* 状态徽章 */}
                                        {isExpired ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                已过期
                                            </span>
                                        ) : isSoonExpiring ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                                                <Clock className="w-3.5 h-3.5" />
                                                即将过期
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                使用中
                                            </span>
                                        )}
                                    </div>

                                    {/* 进度条 - 带百分比显示 */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-500">使用进度: <span className="font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>{usagePercentage}%</span></span>
                                            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>{usedTimes} / {total} 次</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ease-out ${usagePercentage === 100 ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-orange-400'}`}
                                                style={{ width: `${Math.max(usagePercentage, 2)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* 信息网格 - 2列 */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-medium">有效期至</span>
                                            </div>
                                            {exp ? (
                                                <p className="font-bold text-gray-900" style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                                    {new Date(exp).toLocaleDateString('zh-CN')}
                                                </p>
                                            ) : (
                                                <p className="font-bold text-green-600">永久有效</p>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-medium">剩余天数</span>
                                            </div>
                                            {exp ? (
                                                <p className={`font-bold ${daysRemaining !== null && daysRemaining <= 7 ? 'text-amber-600' : 'text-gray-900'}`} style={{ fontFamily: 'Inter, Roboto, system-ui, sans-serif' }}>
                                                    {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} 天` : '已过期'}
                                                </p>
                                            ) : (
                                                <p className="font-bold text-green-600">∞</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 即将过期提醒 */}
                                    {isValid(pkg) && isSoonExpiring && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2.5 border border-amber-200">
                                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                            <p className="text-sm text-amber-700 font-medium">套餐即将过期，请尽快使用</p>
                                        </div>
                                    )}
                                </div>

                                {/* 操作按钮区域 - 底部 */}
                                <div className="px-5 pb-5">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => router.push('/booking')}
                                            disabled={!isValid(pkg)}
                                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl text-base font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
                                        >
                                            立即使用
                                        </button>
                                        <button
                                            onClick={() => handleViewHistory(pkg)}
                                            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-base font-medium transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <History className="w-5 h-5" />
                                            记录
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <PackageIcon className="w-10 h-10 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {showExpired ? '无已过期套餐' : '暂无有效套餐'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {showExpired ? '您目前没有已过期的套餐' : '购买套餐享受更多优惠'}
                    </p>
                    {!showExpired && (
                        <Button onClick={() => router.push('/packages?tab=purchase')} className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white px-8 py-3 text-base font-bold shadow-lg">
                            购买套餐
                        </Button>
                    )}
                </div>
            )}

            {/* ========== 使用说明 ========== */}
            {current.length > 0 && !showExpired && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                        使用说明
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>预约时可选择使用套餐抵扣</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>优先使用即将过期的套餐</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>过期后剩余次数将失效</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>套餐不可转让或退款</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* ========== 使用记录模态框 ========== */}
            {showUsageHistory && selectedPackage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">使用记录</h3>
                                <p className="text-sm text-gray-500">{(selectedPackage as any).package?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            {usageLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                                        <History className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500">暂无使用记录</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {usageLogs.map((log: any) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">订单 #{log.order?.order_number}</p>
                                                <p className="text-sm text-gray-500">{log.order?.string?.brand} {log.order?.string?.model}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-600">{formatDate(log.used_at)}</p>
                                                <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 主组件 ---
export default function PackagesCenter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab') as 'my' | 'purchase' | null;
    const activeTab = tabFromUrl || 'purchase'; // 默认显示购买套餐
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const setTab = (tab: string) => {
        router.replace(`/packages?tab=${tab}`, { scroll: false });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="套餐中心"
                subtitle="购买和管理您的套餐"
            />

            {/* 内容区域 */}
            <div className="max-w-2xl mx-auto p-4 pb-24 space-y-5">
                {/* 分段式标签栏 */}
                <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setTab('purchase')}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'purchase'
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            购买套餐
                        </button>
                        <button
                            onClick={() => setTab('my')}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'my'
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <PackageIcon className="w-4 h-4" />
                            我的套餐
                        </button>
                    </div>
                </div>

                {/* Tab 内容 */}
                {activeTab === 'purchase' ? (
                    <PurchaseTab isVisible={isVisible} />
                ) : (
                    <MyPackagesTab isVisible={isVisible} />
                )}
            </div>
        </div>
    );
}
