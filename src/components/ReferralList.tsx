/**
 * 邀请记录列表组件 (Referral List Component)
 * 
 * 显示用户的邀请记录列表
 */

'use client';

import { UserPlus, CheckCircle, Clock } from 'lucide-react';

// 支持多种referral类型
interface SimpleReferral {
  id: string;
  fullName: string;
  createdAt: Date;
  status?: 'pending' | 'completed';
  rewardPoints: number;
}

interface ReferralListProps {
  referrals: SimpleReferral[];
}

export default function ReferralList({ referrals }: ReferralListProps) {
  if (referrals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          暂无邀请记录
        </h3>
        <p className="text-sm text-gray-500">
          分享你的邀请码给好友，开始赚取积分奖励
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {referrals.map((referral) => (
        <div
          key={referral.id}
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            {/* 左侧：用户信息 */}
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {referral.fullName || '新用户'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(referral.createdAt)}
                </p>
              </div>
            </div>

            {/* 右侧：状态 */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {referral.status === 'completed' ? (
                <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>已奖励</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span>待处理</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 格式化日期
 */
function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return '刚刚';
  } else if (diffInHours < 24) {
    return `${diffInHours} 小时前`;
  } else if (diffInDays < 7) {
    return `${diffInDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
