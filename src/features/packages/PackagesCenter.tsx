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
        <div className="space-y-6">
            {/* 套餐益处说明 */}
            <div className={`bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 p-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">为什么购买套餐？</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span> 价格更优惠
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span> 无需每次支付
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span> 有效期内随用
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">✓</span> 可赠送分享
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 套餐卡片列表 */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {packages.map((pkg, index) => (
                    <div
                        key={pkg.id}
                        style={{ transitionDelay: `${100 + index * 100}ms` }}
                        className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
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

            {/* 购买须知 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    购买须知
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>套餐购买后不支持退款</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>套餐在有效期内可随时使用</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>过期后剩余次数将失效</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>可在"我的套餐"中查看使用记录</span>
                    </li>
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

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (error) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
        </div>
    );

    return (
        <div className={`space-y-5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* 活跃统计 */}
            {current.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">剩余总次数</p>
                            <p className="text-3xl font-bold font-mono text-orange-500">
                                {current.reduce((sum, pkg) => sum + ((pkg as any).remaining || 0), 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">有效套餐</p>
                            <p className="text-3xl font-bold font-mono text-gray-900">{current.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 待审核套餐 */}
            {pending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        待审核套餐 ({pending.length})
                    </h2>
                    {pending.map((payment) => (
                        <div key={payment.id} className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        {payment.packageName}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                                            ⏳ 审核中
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        购买于 {new Date(payment.createdAt).toLocaleDateString('zh-CN')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">穿线次数</p>
                                    <p className="font-semibold text-gray-900">{payment.packageTimes} 次</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">有效期</p>
                                    <p className="font-semibold text-gray-900">{payment.packageValidityDays} 天</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">支付金额</p>
                                    <p className="font-semibold text-orange-500 font-mono">RM {payment.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 切换按钮 - 分段控制器 */}
            {(current.length > 0 || expired.length > 0) && (
                <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowExpired(false)}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${!showExpired
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            有效套餐 ({current.length})
                        </button>
                        <button
                            onClick={() => setShowExpired(true)}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${showExpired
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            已过期 ({expired.length})
                        </button>
                    </div>
                </div>
            )}

            {/* 套餐列表 - 票据风格 */}
            {activeList.length > 0 ? (
                <div className="space-y-4">
                    {activeList.map((pkg, index) => {
                        const packageInfo = (pkg as any).package;
                        const remaining = (pkg as any).remaining || 0;
                        const total = packageInfo?.times || remaining;
                        const usedTimes = Math.max(total - remaining, 0);
                        const usagePercentage = total > 0 ? (usedTimes / total) * 100 : 0;
                        const exp = getExpiry(pkg);
                        const daysRemaining = getDaysRemaining(exp);
                        const isExpired = daysRemaining !== null && daysRemaining < 0;
                        const isSoonExpiring = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

                        return (
                            <div
                                key={pkg.id}
                                className={`relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in ${!isValid(pkg) ? 'opacity-60' : ''}`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* 左侧缺口装饰 */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-r-full" />
                                {/* 右侧缺口装饰 */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-l-full" />

                                <div className="flex">
                                    {/* 左侧主内容区 */}
                                    <div className="flex-1 p-5 pr-3">
                                        {/* 头部：名称 + 状态 */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {packageInfo?.name || '套餐'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        购买于 {formatDate((pkg as any).created_at || (pkg as any).createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* 状态徽章 */}
                                            {isExpired ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                                                    <AlertCircle className="w-3 h-3" />
                                                    已过期
                                                </span>
                                            ) : isSoonExpiring ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                                    <Clock className="w-3 h-3" />
                                                    即将过期
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    使用中
                                                </span>
                                            )}
                                        </div>

                                        {/* 进度条 - 核心视觉 */}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center text-xs mb-1.5">
                                                <span className="text-gray-500">使用进度</span>
                                                <span className="font-medium text-gray-700">{usedTimes} / {total} 次</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${usagePercentage === 100 ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                                    style={{ width: `${usagePercentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* 详细信息 */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-gray-50 p-2.5 rounded-lg">
                                                <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                                                    <PackageIcon className="w-3.5 h-3.5" />
                                                    <span className="text-xs">剩余</span>
                                                </div>
                                                <p className="font-semibold text-gray-900 font-mono">{remaining} 次</p>
                                            </div>
                                            <div className="bg-gray-50 p-2.5 rounded-lg">
                                                <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-xs">有效期</span>
                                                </div>
                                                {exp ? (
                                                    <p className="font-semibold text-gray-900">
                                                        {daysRemaining !== null && daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已过期'}
                                                    </p>
                                                ) : (
                                                    <p className="font-semibold text-green-600">永久有效</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* 即将过期提醒 */}
                                        {isValid(pkg) && isSoonExpiring && (
                                            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg flex items-start gap-2 border border-amber-200">
                                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-700">套餐即将过期，请尽快使用</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 虚线分隔 */}
                                    <div className="w-px border-l border-dashed border-gray-200 my-4" />

                                    {/* 右侧操作区 */}
                                    <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[100px] gap-2">
                                        <button
                                            onClick={() => router.push('/booking')}
                                            disabled={!isValid(pkg)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            立即使用
                                        </button>
                                        <button
                                            onClick={() => handleViewHistory(pkg)}
                                            className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <History className="w-4 h-4" />
                                            记录
                                        </button>
                                    </div>
                                </div>

                                {/* 底部渐变装饰条 */}
                                <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                        <PackageIcon className="w-10 h-10 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {showExpired ? '无已过期套餐' : '暂无有效套餐'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {showExpired ? '您目前没有已过期的套餐' : '购买套餐享受更多优惠'}
                    </p>
                    {!showExpired && (
                        <Button onClick={() => router.push('/packages?tab=purchase')} className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white">
                            购买套餐
                        </Button>
                    )}
                </div>
            )}

            {/* 使用说明 */}
            {current.length > 0 && !showExpired && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">使用说明</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• 预约时可选择使用套餐抵扣</li>
                        <li>• 优先使用即将过期的套餐</li>
                        <li>• 过期后剩余次数将失效</li>
                        <li>• 套餐不可转让或退款</li>
                    </ul>
                </div>
            )}

            {/* 使用记录模态框 */}
            {showUsageHistory && selectedPackage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">使用记录</h3>
                                <p className="text-sm text-gray-500">{(selectedPackage as any).package?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            {usageLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">暂无使用记录</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {usageLogs.map((log: any) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">订单 #{log.order?.order_number}</p>
                                                <p className="text-sm text-gray-500">{log.order?.string?.brand} {log.order?.string?.model}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">{formatDate(log.used_at)}</p>
                                                <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
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
            <div className="max-w-2xl mx-auto p-4 space-y-5">
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
