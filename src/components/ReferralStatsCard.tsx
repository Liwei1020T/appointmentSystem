/**
 * 邀请统计组件 (Referral Stats Component)
 * 
 * 显示用户的邀请统计数据（总邀请人数、成功奖励数、总积分）
 */

'use client';

import { Users, Award, TrendingUp } from 'lucide-react';

interface ReferralStatsProps {
  totalReferrals: number;
  successfulReferrals: number;
  totalRewards: number;
}

export default function ReferralStatsCard({ 
  totalReferrals, 
  successfulReferrals, 
  totalRewards 
}: ReferralStatsProps) {
  const stats = [
    {
      icon: Users,
      label: '邀请人数',
      value: totalReferrals,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Award,
      label: '成功奖励',
      value: successfulReferrals,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      label: '累计积分',
      value: totalRewards,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className={`${stat.bgColor} rounded-lg w-10 h-10 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
