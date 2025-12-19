/**
 * 快捷操作组件 (Quick Actions)
 * 
 * 显示用户首页的主要操作按钮
 * - 立即预约
 * - 查看订单
 * - 购买套餐
 * - 兑换优惠券
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  tone?: 'accent' | 'info' | 'success' | 'warning';
}

function QuickActionButton({ icon, title, description, onClick, tone = 'accent' }: QuickActionProps) {
  const toneStyles = {
    accent: {
      border: 'border-l-accent',
      iconBg: 'bg-accent-soft',
      iconText: 'text-accent',
    },
    info: {
      border: 'border-l-info',
      iconBg: 'bg-info-soft',
      iconText: 'text-info',
    },
    success: {
      border: 'border-l-success',
      iconBg: 'bg-success/15',
      iconText: 'text-success',
    },
    warning: {
      border: 'border-l-warning',
      iconBg: 'bg-warning/15',
      iconText: 'text-warning',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border border-border-subtle border-l-2 ${toneStyles[tone].border} bg-ink-surface hover:bg-ink-elevated/80 transition-colors w-full text-left p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-lg border border-border-subtle ${toneStyles[tone].iconBg} ${toneStyles[tone].iconText}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 text-text-primary">{title}</h3>
          <p className="text-xs text-text-tertiary line-clamp-2">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 4v16m8-8H4"></path>
        </svg>
      ),
      title: '立即预约',
      description: '选择球线、拉力，快速下单',
      onClick: () => router.push('/booking'),
      tone: 'accent',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
      ),
      title: '查看订单',
      description: '查看所有订单状态',
      onClick: () => router.push('/orders'),
      tone: 'info',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      ),
      title: '购买套餐',
      description: '购买优惠配套，省更多',
      onClick: () => router.push('/packages'),
      tone: 'success',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      title: '兑换优惠券',
      description: '使用积分兑换折扣券',
      onClick: () => router.push('/vouchers/exchange'),
      tone: 'warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <QuickActionButton key={index} {...action} />
      ))}
    </div>
  );
}
