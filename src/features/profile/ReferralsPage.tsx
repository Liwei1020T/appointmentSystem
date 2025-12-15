/**
 * 邀请好友页面 (Referrals Page)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Copy, Gift, CheckCircle2, Share2, Sparkles } from 'lucide-react';

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
      const response = await fetch('/api/referrals');
      const data = await response.json();
      
      if (response.ok) {
        setStats({
          referral_code: data.referralCode || '',
          total_referrals: data.totalReferrals || 0,
          total_rewards: data.totalRewards || 0,
          referrals: data.referrals || [],
        });
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }

    setLoading(false);
  };

  const handleCopy = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">邀请好友</h1>
          <p className="text-gray-600">分享邀请码，双方都能获得积分奖励</p>
        </div>

        {/* 邀请卡片 */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-2xl font-bold">您的专属邀请码</h2>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-6">
            <p className="text-purple-100 text-sm mb-2">邀请码</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-mono font-bold tracking-wider">
                {stats?.referral_code}
              </span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
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
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">成功邀请</span>
              </div>
              <p className="text-3xl font-bold">{stats?.total_referrals}</p>
              <p className="text-sm text-purple-100">位好友</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="text-sm">累计奖励</span>
              </div>
              <p className="text-3xl font-bold">{stats?.total_rewards}</p>
              <p className="text-sm text-purple-100">积分</p>
            </div>
          </div>
        </div>

        {/* 邀请奖励说明 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">邀请奖励规则</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">分享您的邀请码</p>
                <p className="text-sm text-gray-600">将邀请码分享给好友</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">好友注册使用</p>
                <p className="text-sm text-gray-600">好友使用您的邀请码注册</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">双方获得奖励</p>
                <p className="text-sm text-gray-600">您和好友各获得 50 积分</p>
              </div>
            </div>
          </div>
        </div>

        {/* 邀请记录 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">邀请记录</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {stats?.referrals && stats.referrals.length > 0 ? (
              stats.referrals.map((referral) => (
                <div key={referral.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referral.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(referral.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-semibold">+{referral.reward_points} 积分</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">还没有邀请记录</p>
                <p className="text-sm text-gray-500 mt-1">快去邀请好友吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
