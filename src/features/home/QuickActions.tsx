/**
 * 快捷操作组件 (Quick Actions)
 * 
 * 视觉设计原则：
 * - 统一使用浅灰描边/阴影，保持克制
 * - 只有主行动（立即预约）用橙色强调
 * - 其他用灰度为主，hover时轻微上色
 * - 固定icon区域大小，避免视觉抖动
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isPrimary?: boolean;
}

function QuickActionButton({ icon, title, description, onClick, isPrimary = false }: QuickActionProps) {
  if (isPrimary) {
    // 主行动：橙色强调
    return (
      <button
        onClick={onClick}
        className="w-full rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/15 hover:border-accent/50 transition-all p-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-xl bg-accent text-white shadow-md">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-accent">{title}</h3>
            <p className="text-xs text-text-secondary mt-0.5 truncate">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-accent opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </button>
    );
  }

  // 次要行动：统一灰色调
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4 text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-xl bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] text-text-primary">{title}</h3>
          <p className="text-xs text-text-tertiary mt-0.5 truncate">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {/* 主行动 - 全宽 */}
      <QuickActionButton
        icon={
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 4v16m8-8H4"></path>
          </svg>
        }
        title="立即预约"
        description="选择球线、拉力，快速下单"
        onClick={() => router.push('/booking')}
        isPrimary
      />

      {/* 次要行动 - 2列 */}
      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton
          icon={
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          }
          title="查看订单"
          description="查看所有订单状态"
          onClick={() => router.push('/orders')}
        />
        <QuickActionButton
          icon={
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          }
          title="购买套餐"
          description="购买优惠配套，省更多"
          onClick={() => router.push('/packages')}
        />
        <QuickActionButton
          icon={
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          title="兑换优惠券"
          description="使用积分兑换折扣券"
          onClick={() => router.push('/vouchers/exchange')}
        />
        <QuickActionButton
          icon={
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          }
          title="我的优惠券"
          description="查看已有优惠券"
          onClick={() => router.push('/vouchers')}
        />
      </div>
    </div>
  );
}

