/**
 * 套餐中心组件 (Packages Center)
 * 
 * 统一处理套餐购买和查看已购买套餐
 * 支持 Tab 切换，提供无缝的用户体验
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Package as PackageIcon,
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    TrendingDown,
    History,
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
                <div key={i} className="rounded-2xl bg-ink-surface border border-border-subtle p-6 animate-pulse h-64" />
            ))}
        </div>
    );

    if (error) return <Card className="p-8 text-center text-danger">{error}</Card>;

    if (packages.length === 0) return (
        <Card className="p-12 text-center">
            <PackageIcon className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">暂无可购买套餐</h3>
            <p className="text-text-secondary">敬请期待更多优惠套餐</p>
        </Card>
    );

    return (
        <div className="space-y-8">
            {/* 套餐益处说明 */}
            <Card className={`p-6 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary mb-3">为什么购买套餐？</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <span className="text-success">✓</span> 价格更优惠
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <span className="text-success">✓</span> 无需每次支付
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <span className="text-success">✓</span> 有效期内随用
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <span className="text-success">✓</span> 可赠送分享
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

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
            <Card className="p-6 bg-ink-elevated border border-border-subtle">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-info" />
                    购买须知
                </h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                        <span className="text-text-tertiary">•</span>
                        <span>套餐购买后不支持退款</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-text-tertiary">•</span>
                        <span>套餐在有效期内可随时使用</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-text-tertiary">•</span>
                        <span>过期后剩余次数将失效</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-text-tertiary">•</span>
                        <span>可在"我的套餐"中查看使用记录</span>
                    </li>
                </ul>
            </Card>
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

    // 获取套餐状态
    const getPackageStatus = (pkg: UserPackageWithPackage) => {
        const exp = getExpiry(pkg);
        const daysRemaining = getDaysRemaining(exp);

        if (daysRemaining !== null && daysRemaining < 0) {
            return { label: '已过期', color: 'bg-danger/15 text-danger border-danger/40', icon: <AlertCircle className="w-4 h-4" /> };
        } else if (daysRemaining !== null && daysRemaining <= 7) {
            return { label: `即将过期 (${daysRemaining}天)`, color: 'bg-warning/15 text-warning border-warning/40', icon: <Clock className="w-4 h-4" /> };
        } else {
            return { label: '使用中', color: 'bg-success/15 text-success border-success/40', icon: <CheckCircle2 className="w-4 h-4" /> };
        }
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

    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    if (error) return (
        <Card className="p-6 text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
        </Card>
    );

    return (
        <div className={`space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* 活跃统计 */}
            {current.length > 0 && (
                <Card className="p-6 bg-ink-elevated text-text-primary border border-border-subtle">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-text-tertiary text-sm mb-1">剩余总次数</p>
                            <p className="text-3xl font-bold font-mono text-accent">
                                {current.reduce((sum, pkg) => sum + ((pkg as any).remaining || 0), 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-sm mb-1">有效套餐</p>
                            <p className="text-3xl font-bold font-mono">{current.length}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* 待审核套餐 */}
            {pending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
                        待审核套餐 ({pending.length})
                    </h2>
                    {pending.map((payment) => (
                        <Card key={payment.id} className="p-5 border-2 border-info/30 bg-info/5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                        {payment.packageName}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info/20 text-info border border-info/30">
                                            ⏳ 审核中
                                        </span>
                                    </h3>
                                    <p className="text-sm text-text-tertiary mt-1">
                                        购买于 {new Date(payment.createdAt).toLocaleDateString('zh-CN')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-text-tertiary">穿线次数</p>
                                    <p className="font-semibold text-text-primary">{payment.packageTimes} 次</p>
                                </div>
                                <div>
                                    <p className="text-text-tertiary">有效期</p>
                                    <p className="font-semibold text-text-primary">{payment.packageValidityDays} 天</p>
                                </div>
                                <div>
                                    <p className="text-text-tertiary">支付金额</p>
                                    <p className="font-semibold text-accent font-mono">RM {payment.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* 切换按钮 */}
            {(current.length > 0 || expired.length > 0) && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowExpired(false)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showExpired
                            ? 'bg-accent text-text-onAccent'
                            : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                            }`}
                    >
                        有效套餐 ({current.length})
                    </button>
                    <button
                        onClick={() => setShowExpired(true)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showExpired
                            ? 'bg-accent text-text-onAccent'
                            : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                            }`}
                    >
                        已过期 ({expired.length})
                    </button>
                </div>
            )}

            {/* 套餐列表 */}
            {activeList.length > 0 ? (
                <div className="space-y-4">
                    {activeList.map((pkg) => {
                        const status = getPackageStatus(pkg);
                        const packageInfo = (pkg as any).package;
                        const remaining = (pkg as any).remaining || 0;
                        const total = packageInfo?.times || remaining;
                        const usedTimes = Math.max(total - remaining, 0);
                        const usagePercentage = total > 0 ? (usedTimes / total) * 100 : 0;
                        const exp = getExpiry(pkg);
                        const daysRemaining = getDaysRemaining(exp);

                        return (
                            <Card key={pkg.id} className={`p-6 ${!isValid(pkg) ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">
                                            {packageInfo?.name || '套餐'}
                                        </h3>
                                        <p className="text-sm text-text-tertiary mt-1">
                                            购买于 {formatDate((pkg as any).created_at || (pkg as any).createdAt)}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                                        {status.icon}
                                        {status.label}
                                    </span>
                                </div>

                                {/* 进度条 */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-sm text-text-tertiary">使用进度</span>
                                        <span className="text-sm font-medium text-text-primary">
                                            {usedTimes} / {total} 次
                                        </span>
                                    </div>
                                    <div className="w-full bg-ink-elevated rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${usagePercentage === 100 ? 'bg-ink-surface' : 'bg-accent'}`}
                                            style={{ width: `${usagePercentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* 详细信息 */}
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div className="bg-ink-elevated p-3 rounded-lg border border-border-subtle">
                                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                                            <PackageIcon className="w-4 h-4" />
                                            <span className="text-xs">剩余次数</span>
                                        </div>
                                        <p className="text-lg font-semibold text-text-primary font-mono">{remaining} 次</p>
                                    </div>
                                    <div className="bg-ink-elevated p-3 rounded-lg border border-border-subtle">
                                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-xs">有效期</span>
                                        </div>
                                        {exp ? (
                                            <div>
                                                <p className="font-semibold text-text-primary">
                                                    {daysRemaining !== null && daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已过期'}
                                                </p>
                                                <p className="text-xs text-text-tertiary mt-0.5">
                                                    {new Date(exp).toLocaleDateString('zh-CN')}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="font-semibold text-success">永久有效</p>
                                        )}
                                    </div>
                                </div>

                                {/* 即将过期提醒 */}
                                {isValid(pkg) && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
                                    <div className="mb-4 p-3 bg-warning/10 rounded-lg flex items-start gap-2 border border-warning/30">
                                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-warning">套餐即将过期，请尽快使用</p>
                                    </div>
                                )}

                                {/* 操作按钮 */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push('/booking')}
                                        className="flex-1 px-4 py-2 bg-accent hover:shadow-glow text-text-onAccent rounded-lg font-medium transition-colors"
                                        disabled={!isValid(pkg)}
                                    >
                                        立即使用
                                    </button>
                                    <button
                                        onClick={() => handleViewHistory(pkg)}
                                        className="px-4 py-2 border border-border-subtle hover:bg-ink-elevated text-text-secondary rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        <History className="w-4 h-4" />
                                        记录
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <PackageIcon className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {showExpired ? '无已过期套餐' : '暂无有效套餐'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                        {showExpired ? '您目前没有已过期的套餐' : '购买套餐享受更多优惠'}
                    </p>
                    {!showExpired && (
                        <Button onClick={() => router.push('/packages?tab=purchase')}>购买套餐</Button>
                    )}
                </Card>
            )}

            {/* 使用说明 */}
            {current.length > 0 && !showExpired && (
                <Card className="p-6 bg-ink-elevated border border-border-subtle">
                    <h3 className="font-semibold text-text-primary mb-3">使用说明</h3>
                    <ul className="space-y-2 text-sm text-text-secondary">
                        <li>• 预约时可选择使用套餐抵扣</li>
                        <li>• 优先使用即将过期的套餐</li>
                        <li>• 过期后剩余次数将失效</li>
                        <li>• 套餐不可转让或退款</li>
                    </ul>
                </Card>
            )}

            {/* 使用记录模态框 */}
            {showUsageHistory && selectedPackage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-ink-surface rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">使用记录</h3>
                                <p className="text-sm text-text-secondary">{(selectedPackage as any).package?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="p-2 hover:bg-ink-elevated rounded-lg transition-colors text-text-secondary"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            {usageLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                                    <p className="text-text-secondary">暂无使用记录</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {usageLogs.map((log: any) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-4 bg-ink-elevated rounded-lg border border-border-subtle"
                                        >
                                            <div>
                                                <p className="font-medium text-text-primary">订单 #{log.order?.order_number}</p>
                                                <p className="text-sm text-text-secondary">{log.order?.string?.brand} {log.order?.string?.model}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-text-secondary">{formatDate(log.used_at)}</p>
                                                <CheckCircle2 className="w-5 h-5 text-success ml-auto mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-border-subtle">
                            <button
                                onClick={() => setShowUsageHistory(false)}
                                className="w-full px-4 py-2 bg-ink-elevated hover:bg-ink-surface text-text-secondary rounded-lg font-medium transition-colors"
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
        <div className="min-h-screen bg-ink">
            {/* 页面头部 */}
            <div className="bg-ink-surface border-b border-border-subtle sticky top-0 z-30">
                <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-secondary" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-text-primary">套餐中心</h1>
                        <p className="text-sm text-text-tertiary mt-1">购买和管理您的套餐</p>
                    </div>
                </div>

                {/* Tab 切换器 */}
                <div className="max-w-2xl mx-auto px-4 flex border-t border-border-subtle">
                    <button
                        onClick={() => setTab('purchase')}
                        className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeTab === 'purchase' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            购买套餐
                        </div>
                        {activeTab === 'purchase' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                    </button>
                    <button
                        onClick={() => setTab('my')}
                        className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeTab === 'my' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <PackageIcon className="w-4 h-4" />
                            我的套餐
                        </div>
                        {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="max-w-2xl mx-auto p-4 py-8">
                {activeTab === 'purchase' ? (
                    <PurchaseTab isVisible={isVisible} />
                ) : (
                    <MyPackagesTab isVisible={isVisible} />
                )}
            </div>
        </div>
    );
}
