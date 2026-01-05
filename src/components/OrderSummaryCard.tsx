/**
 * 订单摘要卡组件 (Order Summary Card)
 * 
 * 在订单详情页顶部显示关键信息：
 * - 订单状态与提示
 * - 球拍数量、实付金额、支付状态
 * - 状态驱动的行动按钮
 */

'use client';

import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    Wrench,
    CheckCircle,
    XCircle,
    Gift,
    Clock,
    Disc,
    Banknote,
    Star,
    LucideIcon,
} from 'lucide-react';

interface OrderSummaryCardProps {
    order: {
        id: string;
        status: string;
        final_price?: number;
        price?: number;
        use_package?: boolean;
        items?: any[];
        payments?: any[];
        string?: { brand?: string; model?: string };
    };
    hasReview: boolean;
    onPayClick: () => void;
    onReviewClick: () => void;
    onCancelClick: () => void;
}

// 状态配置 - 使用 Lucide 图标
const statusConfig: Record<string, { label: string; tip: string; icon: LucideIcon; color: string; iconBg: string }> = {
    pending: { label: '待付款', tip: '请完成支付', icon: CreditCard, color: 'text-warning', iconBg: 'bg-warning/15' },
    in_progress: { label: '穿线中', tip: '正在为您处理', icon: Wrench, color: 'text-info', iconBg: 'bg-info/15' },
    completed: { label: '已完成', tip: '可取拍', icon: CheckCircle, color: 'text-success', iconBg: 'bg-success/15' },
    cancelled: { label: '已取消', tip: '', icon: XCircle, color: 'text-text-tertiary', iconBg: 'bg-ink-surface' },
};

export default function OrderSummaryCard({
    order,
    hasReview,
    onPayClick,
    onReviewClick,
    onCancelClick,
}: OrderSummaryCardProps) {
    const router = useRouter();

    // 支付状态判断（需要放在 status 判断之前）
    const hasCompletedPayment = order.payments?.some((p: any) =>
        p.status === 'completed' || p.status === 'success'
    ) || false;

    // 根据支付状态确定显示的状态
    // 如果订单还是 pending 但已支付，显示 "已支付" 状态
    const displayStatus = (order.status === 'pending' && hasCompletedPayment)
        ? { label: '已支付', tip: '等待处理', icon: CheckCircle, color: 'text-success', iconBg: 'bg-success/15' }
        : (statusConfig[order.status] || statusConfig.pending);

    const status = displayStatus;
    const StatusIcon = status.icon;
    const racketCount = order.items?.length || 1;
    const finalAmount = Number(order.final_price ?? order.price ?? 0);


    const hasPendingPayment = order.payments?.some((p: any) => p.status === 'pending') || false;
    const hasPendingVerification = order.payments?.some((p: any) => p.status === 'pending_verification') || false;
    const paymentProvider = order.payments?.[0]?.provider;

    // 支付状态配置 - 使用 Lucide 图标
    const getPaymentStatus = (): { text: string; icon: LucideIcon } => {
        if (order.use_package) return { text: '套餐支付', icon: Gift };
        if (hasCompletedPayment || order.status === 'completed') return { text: '已支付', icon: CheckCircle };
        if (hasPendingVerification) return { text: '待审核', icon: Clock };
        if (hasPendingPayment) return { text: '待确认', icon: Clock };
        return { text: '未支付', icon: CreditCard };
    };

    const paymentStatus = getPaymentStatus();
    const providerLabel = paymentProvider === 'cash' ? '现金' : paymentProvider === 'tng' ? 'TnG' : '';

    // 再来一单
    const handleReorder = () => {
        router.push('/booking');
    };

    return (
        <Card className="p-5 bg-ink-elevated border-2 border-accent-border/50">
            {/* 状态行 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.iconBg}`}>
                        <StatusIcon className={`w-6 h-6 ${status.color}`} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>
                        {status.tip && (
                            <p className="text-sm text-text-secondary">{status.tip}</p>
                        )}
                    </div>
                </div>

                {/* 主行动按钮 - 桌面端 */}
                <div className="hidden sm:flex gap-2">
                    {order.status === 'pending' && !hasCompletedPayment && !hasPendingPayment && !hasPendingVerification && (
                        <>
                            <Button variant="secondary" size="sm" onClick={onCancelClick}>
                                取消
                            </Button>
                            <Button variant="primary" size="sm" onClick={onPayClick} className="flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4" /> 立即付款
                            </Button>
                        </>
                    )}

                    {order.status === 'completed' && !hasReview && (
                        <>
                            <Button variant="secondary" size="sm" onClick={handleReorder}>
                                再来一单
                            </Button>
                            <Button variant="primary" size="sm" onClick={onReviewClick} className="flex items-center gap-1.5">
                                <Star className="w-4 h-4" /> 评价 +10积分
                            </Button>
                        </>
                    )}

                    {order.status === 'completed' && hasReview && (
                        <Button variant="primary" size="sm" onClick={handleReorder} className="flex items-center gap-1.5">
                            <Disc className="w-4 h-4" /> 再来一单
                        </Button>
                    )}
                </div>
            </div>

            {/* 信息概览行 */}
            {(() => {
                const PaymentIcon = paymentStatus.icon;
                return (
                    <div className="flex items-center gap-4 text-sm bg-ink-surface rounded-lg p-3 border border-border-subtle">
                        <div className="flex items-center gap-1.5">
                            <Disc className="w-4 h-4 text-text-tertiary" />
                            <span className="text-text-secondary">{racketCount} 支球拍</span>
                        </div>
                        <div className="w-px h-4 bg-border-subtle" />
                        <div className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-text-tertiary" />
                            <span className="font-bold text-text-primary font-mono">RM {finalAmount.toFixed(2)}</span>
                        </div>
                        <div className="w-px h-4 bg-border-subtle" />
                        <div className="flex items-center gap-1.5">
                            <PaymentIcon className="w-4 h-4 text-text-tertiary" />
                            <span className="text-text-secondary">
                                {paymentStatus.text}
                                {providerLabel && <span className="text-text-tertiary"> ({providerLabel})</span>}
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* 主行动按钮 - 移动端 */}
            <div className="flex sm:hidden gap-2 mt-4">
                {order.status === 'pending' && !hasCompletedPayment && !hasPendingPayment && !hasPendingVerification && (
                    <>
                        <Button variant="secondary" size="sm" onClick={onCancelClick} className="flex-1">
                            取消
                        </Button>
                        <Button variant="primary" size="sm" onClick={onPayClick} className="flex-1 flex items-center justify-center gap-1.5">
                            <CreditCard className="w-4 h-4" /> 立即付款
                        </Button>
                    </>
                )}

                {order.status === 'completed' && !hasReview && (
                    <>
                        <Button variant="secondary" size="sm" onClick={handleReorder} className="flex-1">
                            再来一单
                        </Button>
                        <Button variant="primary" size="sm" onClick={onReviewClick} className="flex-1 flex items-center justify-center gap-1.5">
                            <Star className="w-4 h-4" /> 评价 +10积分
                        </Button>
                    </>
                )}

                {order.status === 'completed' && hasReview && (
                    <Button variant="primary" size="sm" onClick={handleReorder} fullWidth className="flex items-center justify-center gap-1.5">
                        <Disc className="w-4 h-4" /> 再来一单
                    </Button>
                )}
            </div>
        </Card>
    );
}
