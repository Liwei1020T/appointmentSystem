/**
 * 我的邀请页面 (My Referrals Page)
 * 
 * 显示用户的邀请码、统计数据、邀请记录
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import ReferralStatsCard from '@/components/ReferralStatsCard';
import ReferralList from '@/components/ReferralList';
import { getMyReferralStats, MyReferralStats } from '@/services/referralService';
import toast from 'react-hot-toast';

export default function MyReferralsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<MyReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMyReferralStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || '加载失败');
      toast.error('获取邀请数据失败');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-tertiary">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="bg-ink-surface rounded-lg border border-border-subtle p-6 max-w-sm w-full text-center">
          <div className="bg-danger/15 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            加载失败
          </h3>
          <p className="text-sm text-text-tertiary mb-4">{error}</p>
          <button
            onClick={loadStats}
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
          <h1 className="text-lg font-bold text-text-primary">我的邀请</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 邀请卡片 */}
        <InviteCard />

        {/* 统计卡片 */}
        {stats && (
          <ReferralStatsCard
            totalReferrals={stats.referralCount}
            successfulReferrals={stats.referralCount}
            totalRewards={stats.totalPoints}
          />
        )}

        {/* 邀请记录 */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            邀请记录
          </h2>
          {stats && <ReferralList referrals={stats.referrals} />}
        </div>

        {/* 邀请说明 */}
        <div className="bg-ink-elevated border border-border-subtle rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            💡 如何邀请好友？
          </h3>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• 分享你的专属邀请码或链接给好友</li>
            <li>• 好友使用你的邀请码注册</li>
            <li>• 注册成功后，双方立即获得积分奖励</li>
            <li>• 你获得 50 积分，好友获得 20 积分</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
