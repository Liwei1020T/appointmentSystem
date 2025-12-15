/**
 * 邀请排行榜页面 (Referral Leaderboard Page)
 * 
 * 显示邀请人数最多的用户排行榜
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getReferralLeaderboard } from '@/services/referralService';
import type { LeaderboardEntry } from '@/services/referralService';
import toast from 'react-hot-toast';

export default function ReferralLeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getReferralLeaderboard(20);
      setLeaderboard(data || []);
    } catch (err: any) {
      setError(err?.message || '加载失败');
      toast.error('获取排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-sm w-full text-center">
          <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            加载失败
          </h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">邀请排行榜</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 排行榜说明 */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">邀请达人榜</h2>
              <p className="text-sm text-white/90">邀请越多，奖励越丰厚</p>
            </div>
          </div>
        </div>

        {/* 排行榜列表 */}
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无排行数据
            </h3>
            <p className="text-sm text-gray-500">
              成为第一个邀请好友的用户吧！
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 排名图标 */}
                  <div className="flex-shrink-0 w-10">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {entry.fullName}
                    </p>
                  </div>

                  {/* 邀请数据 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {entry.referralCount}
                    </p>
                    <p className="text-xs text-gray-500">邀请人数</p>
                  </div>

                  {/* 积分奖励 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-green-600">
                      +{entry.totalPoints}
                    </p>
                    <p className="text-xs text-gray-500">积分</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-xs text-blue-800">
            💡 <span className="font-semibold">提示：</span>
            排行榜每小时更新一次，邀请越多排名越高！
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 获取排名图标
 */
function getRankIcon(rank: number) {
  if (rank === 1) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
        <Trophy className="w-5 h-5 text-white" />
      </div>
    );
  } else if (rank === 2) {
    return (
      <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  } else if (rank === 3) {
    return (
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
        <Award className="w-5 h-5 text-white" />
      </div>
    );
  } else {
    return (
      <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-600">{rank}</span>
      </div>
    );
  }
}

/**
 * 邮箱脱敏
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal =
    localPart.length > 2
      ? localPart.substring(0, 2) + '***'
      : localPart + '***';

  return `${maskedLocal}@${domain}`;
}
