import React from 'react';
import { formatCurrency } from '@/lib/utils';

export type MembershipTier = 'SILVER' | 'GOLD' | 'VIP';

interface TierBenefit {
  description: string;
  isActive: boolean;
}

interface MembershipCardProps {
  currentTier: MembershipTier;
  points: number;
  totalSpent: number;
  nextTier: MembershipTier | null;
  spentProgress: number;
  ordersProgress: number;
  spentTarget: number;
  ordersTarget: number;
  benefits: TierBenefit[];
}

const TIER_COLORS = {
  SILVER: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-300',
    text: 'text-gray-800',
    border: 'border-gray-200',
    icon: 'text-gray-600',
  },
  GOLD: {
    bg: 'bg-gradient-to-br from-amber-100 to-amber-300',
    text: 'text-amber-900',
    border: 'border-amber-200',
    icon: 'text-amber-700',
  },
  VIP: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-300',
    text: 'text-purple-900',
    border: 'border-purple-200',
    icon: 'text-purple-700',
  },
};

export default function MembershipCard({
  currentTier,
  points,
  totalSpent,
  nextTier,
  spentProgress,
  ordersProgress,
  spentTarget,
  benefits,
}: MembershipCardProps) {
  const colors = TIER_COLORS[currentTier] || TIER_COLORS.SILVER;

  return (
    <div className={`rounded-2xl shadow-lg border ${colors.border} overflow-hidden`}>
      {/* 顶部卡片区域 */}
      <div className={`${colors.bg} p-6 relative overflow-hidden`}>
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium ${colors.text} opacity-80 uppercase tracking-wider`}>
              当前等级
            </p>
            <h2 className={`text-3xl font-bold ${colors.text} font-display mt-1`}>
              {currentTier} MEMBER
            </h2>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${colors.text} opacity-80`}>可用积分</p>
            <p className={`text-2xl font-bold ${colors.text} font-mono`}>{points}</p>
          </div>
        </div>

        {/* 升级进度 */}
        {nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1 font-medium opacity-90">
              <span className={colors.text}>距离 {nextTier} 还需要</span>
              <span className={colors.text}>
                再消费 {formatCurrency(Math.max(0, spentTarget - totalSpent))}
              </span>
            </div>

            {/* 消费进度条 */}
            <div className="h-2 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.max(5, spentProgress)}%` }}
              />
            </div>

            {/* 订单进度条 (如果需要显示两个维度的进度，可以取消注释)
            <div className="mt-2">
               <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-1000"
                  style={{ width: `${ordersProgress}%` }}
                />
              </div>
            </div>
            */}
          </div>
        )}
      </div>

      {/* 权益列表 */}
      <div className="bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className={`w-1.5 h-4 rounded-full ${colors.bg}`}></span>
          会员专属权益
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
              <svg className={`w-4 h-4 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{benefit.description}</span>
            </div>
          ))}
          {benefits.length === 0 && (
            <p className="text-sm text-gray-400 italic">暂无特殊权益</p>
          )}
        </div>
      </div>
    </div>
  );
}
