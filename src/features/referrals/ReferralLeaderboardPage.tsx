/**
 * 邀请排行榜页面 (Referral Leaderboard Page)
 * 
 * 显示邀请人数最多的用户排行榜
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getReferralLeaderboard } from '@/services/referralService';
import type { LeaderboardEntry } from '@/services/referralService';
import toast from 'react-hot-toast';
import PageLoading from '@/components/loading/PageLoading';

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
    return <PageLoading surface="dark" />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="bg-ink-surface rounded-lg border border-border-subtle p-6 max-w-sm w-full text-center">
          <div className="bg-danger/15 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            加载失败
          </h3>
          <p className="text-sm text-text-tertiary mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="w-full bg-accent text-text-onAccent rounded-lg px-4 py-2 text-sm font-medium hover:shadow-glow transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-20">
      {/* Header */}
      <div className="bg-ink border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">邀请排行榜</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 排行榜说明 */}
        <div className="bg-gradient-to-r from-accent/30 via-ink-surface to-ink-elevated rounded-lg p-6 text-text-primary mb-6 border border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-xl font-bold">邀请达人榜</h2>
              <p className="text-sm text-text-secondary">邀请越多，奖励越丰厚</p>
            </div>
          </div>
        </div>

        {/* 排行榜列表 */}
        {leaderboard.length === 0 ? (
          <div className="bg-ink-surface rounded-lg border border-border-subtle p-8 text-center">
            <div className="bg-ink-elevated rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              暂无排行数据
            </h3>
            <p className="text-sm text-text-tertiary">
              成为第一个邀请好友的用户吧！
            </p>
          </div>
        ) : (
          <div className="bg-ink-surface rounded-lg border border-border-subtle divide-y divide-border-subtle">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className="p-4 hover:bg-ink-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 排名图标 */}
                  <div className="flex-shrink-0 w-10">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {entry.fullName}
                    </p>
                  </div>

                  {/* 邀请数据 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-accent">
                      {entry.referralCount}
                    </p>
                    <p className="text-xs text-text-tertiary">邀请人数</p>
                  </div>

                  {/* 积分奖励 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-success">
                      +{entry.totalPoints}
                    </p>
                    <p className="text-xs text-text-tertiary">积分</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        <div className="bg-ink-elevated border border-border-subtle rounded-lg p-4 mt-6">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold">提示：</span>
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
      <div className="bg-gradient-to-br from-accent to-accent/80 rounded-full w-10 h-10 flex items-center justify-center shadow-glow">
        <Trophy className="w-5 h-5 text-ink" />
      </div>
    );
  } else if (rank === 2) {
    return (
      <div className="bg-gradient-to-br from-ink-elevated to-ink-surface rounded-full w-10 h-10 flex items-center justify-center shadow-sm border border-border-subtle">
        <Medal className="w-5 h-5 text-text-primary" />
      </div>
    );
  } else if (rank === 3) {
    return (
      <div className="bg-gradient-to-br from-warning/60 to-warning/90 rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
        <Award className="w-5 h-5 text-ink" />
      </div>
    );
  } else {
    return (
      <div className="bg-ink-elevated rounded-full w-10 h-10 flex items-center justify-center border border-border-subtle">
        <span className="text-sm font-bold text-text-secondary">{rank}</span>
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
