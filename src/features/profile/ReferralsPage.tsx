/**
 * 邀请好友页面 (Referrals Page)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Copy, Gift, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import { Toast } from '@/components';
import PageLoading from '@/components/loading/PageLoading';
import { getReferrals } from '@/services/profileService';

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  total_rewards: number;
  referrals: Array<{
    id: string;
    full_name: string;
    created_at: string;
    reward_points: number;
  }>;
}

export default function ReferralsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      // 获取邀请统计
      const data = await getReferrals();

      const referrals = Array.isArray(data?.referrals) ? data.referrals : [];
      const totalRewards = data?.stats?.totalRewards ?? 0;
      const totalPointsEarned = data?.stats?.totalPointsEarned ?? 0;
      const rewardPointsPerReferral = totalRewards
        ? Math.round(totalPointsEarned / totalRewards)
        : 0;
      const mappedReferrals = referrals.map((referral: any) => ({
        id: referral.id,
        full_name: referral.referred?.fullName || '用户',
        created_at: referral.referred?.createdAt || referral.createdAt,
        reward_points: referral.rewardGiven ? rewardPointsPerReferral : 0,
      }));

      setStats({
        referral_code: data?.referralCode || '',
        total_referrals: data?.stats?.totalReferrals ?? referrals.length,
        total_rewards: totalPointsEarned,
        referrals: mappedReferrals,
      });
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    if (!stats?.referral_code) {
      setToast({
        show: true,
        message: '暂无可复制的邀请码',
        type: 'warning',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      setToast({
        show: true,
        message: '邀请码已复制',
        type: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral code:', error);
      setToast({
        show: true,
        message: '复制失败，请重试',
        type: 'error',
      });
    }
  };

  const handleShare = () => {
    if (navigator.share && stats?.referral_code) {
      navigator.share({
        title: 'String Service 邀请',
        text: `使用我的邀请码 ${stats.referral_code} 注册，双方都能获得50积分奖励！`,
        url: `https://stringservice.com/signup?ref=${stats.referral_code}`,
      });
    }
  };

  if (loading) {
    return <PageLoading surface="dark" />;
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text-primary">邀请好友</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-text-secondary">分享邀请码，双方都能获得积分奖励</p>
        </div>

        {/* 邀请卡片 */}
        <div className="bg-gradient-to-br from-accent/25 via-ink-surface to-ink-elevated rounded-lg border border-border-subtle p-8 mb-8 text-text-primary">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-accent" />
            <h2 className="text-2xl font-bold">您的专属邀请码</h2>
          </div>

          <div className="bg-ink-elevated/70 backdrop-blur-sm rounded-lg p-6 mb-6 border border-border-subtle">
            <p className="text-text-tertiary text-sm mb-2">邀请码</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-mono font-bold tracking-wider">
                {stats?.referral_code}
              </span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg font-medium hover:shadow-glow transition-colors inline-flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-ink-elevated text-text-primary rounded-lg font-medium hover:bg-ink-surface transition-colors inline-flex items-center gap-2 border border-border-subtle"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-ink-elevated/70 backdrop-blur-sm rounded-lg p-4 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm text-text-secondary">成功邀请</span>
              </div>
              <p className="text-3xl font-bold">{stats?.total_referrals}</p>
              <p className="text-sm text-text-tertiary">位好友</p>
            </div>

            <div className="bg-ink-elevated/70 backdrop-blur-sm rounded-lg p-4 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="text-sm text-text-secondary">累计奖励</span>
              </div>
              <p className="text-3xl font-bold">{stats?.total_rewards}</p>
              <p className="text-sm text-text-tertiary">积分</p>
            </div>
          </div>
        </div>

        {/* 邀请奖励说明 */}
        <div className="bg-ink-surface rounded-lg border border-border-subtle p-6 mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">邀请奖励规则</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">分享您的邀请码</p>
                <p className="text-sm text-text-secondary">将邀请码分享给好友</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">好友注册使用</p>
                <p className="text-sm text-text-secondary">好友使用您的邀请码注册</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">双方获得奖励</p>
                <p className="text-sm text-text-secondary">您和好友各获得 50 积分</p>
              </div>
            </div>
          </div>
        </div>

        {/* 邀请记录 */}
        <div className="bg-ink-surface rounded-lg border border-border-subtle">
          <div className="p-6 border-b border-border-subtle">
            <h3 className="text-lg font-semibold text-text-primary">邀请记录</h3>
          </div>

          <div className="divide-y divide-border-subtle">
            {stats?.referrals && stats.referrals.length > 0 ? (
              stats.referrals.map((referral) => (
                <div key={referral.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{referral.full_name}</p>
                      <p className="text-sm text-text-secondary">
                        {new Date(referral.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-success font-semibold">+{referral.reward_points} 积分</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">还没有邀请记录</p>
                <p className="text-sm text-text-tertiary mt-1">快去邀请好友吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
