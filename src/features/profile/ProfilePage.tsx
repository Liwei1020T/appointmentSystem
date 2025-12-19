/**
 * 个人资料页面 (Profile Page)
 * 
 * 显示用户基本信息、统计数据和快捷入口
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getUserProfile,
  getUserStats,
  generateReferralCode,
  logout,
  UserProfile,
} from '@/services/profileService';
import { Card, Spinner, Badge, Button, Modal, Toast } from '@/components';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 加载数据
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [profileResult, statsResult, codeResult] = await Promise.all([
        getUserProfile(),
        getUserStats(),
        generateReferralCode(),
      ]);

      if (profileResult.error) {
        setError(profileResult.error?.message || profileResult.error);
      } else {
        setProfile(profileResult.profile || null);
      }

      // getUserStats returns UserStats directly
      setStats(statsResult);

      if (codeResult.error) {
        console.error('Referral code error:', codeResult.error);
      } else {
        setReferralCode(codeResult.code || '');
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 复制邀请码
  const handleCopyReferralCode = async () => {
    if (!referralCode) {
      setToast({
        show: true,
        message: '暂无可复制的邀请码',
        type: 'warning',
      });
      return;
    }

    try {
      // Modern Clipboard API (requires secure context: https/localhost)
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        // Fallback for older browsers / non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = referralCode;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) throw new Error('copy_failed');
      }

      setToast({
        show: true,
        message: '邀请码已复制到剪贴板',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Copy referral code failed:', err);
      setToast({
        show: true,
        message: '复制失败，请手动选择并复制',
        type: 'error',
      });
    }
  };

  // 退出登录
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const { success } = await logout();

      if (!success) {
        setToast({
          show: true,
          message: '退出登录失败',
          type: 'error',
        });
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '退出登录失败',
        type: 'error',
      });
    } finally {
      setLoggingOut(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部个人信息卡片 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4">
            {/* 头像 */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="用户头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.full_name || profile.fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            
            {/* 用户信息 */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{profile.full_name || profile.fullName || '用户'}</h1>
              <p className="text-blue-100 text-sm">{profile.email}</p>
              {profile.phone && (
                <p className="text-blue-100 text-sm">{profile.phone}</p>
              )}
            </div>

            {/* 编辑按钮 */}
            <button
              onClick={() => router.push('/profile/edit')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 积分卡片 */}
        <Card>
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => router.push('/points')}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600">我的积分</p>
                <p className="text-2xl font-bold text-slate-900">{profile.points}</p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">总订单</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">活跃套餐</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activePackages}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">可用优惠券</p>
                <p className="text-2xl font-bold text-orange-600">{stats.availableVouchers}</p>
              </div>
            </Card>
          </div>
        )}

        {stats?.membership && (
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70">
                    会员等级
                  </p>
                  <h3 className="text-2xl font-bold">{stats.membership.label}</h3>
                  <p className="text-sm text-white/80">{stats.membership.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70">当前折扣</p>
                  <p className="text-2xl font-semibold">
                    {stats.membership.discountRate}% OFF
                  </p>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-white/60">累计消费</p>
                <p className="text-xl font-semibold">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, stats.membership.progress * 100))}%` }}
                />
              </div>
              <p className="text-xs text-white/70">
                {stats.membership.nextTier
                  ? `再消费 ${formatCurrency(
                      Math.max(0, stats.membership.nextTier.minSpend - stats.totalSpent)
                    )} 可升级为 ${stats.membership.nextTier.label}`
                  : '已达到最高会员等级，继续保持高光！'}
              </p>
            </div>
          </Card>
        )}

        {/* 邀请好友 */}
        {referralCode && (
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                邀请好友赚积分
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                邀请好友注册并完成首单，您和好友各得 50 积分
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-lg px-4 py-3 text-center">
                  <p className="text-xs text-slate-600 mb-1">我的邀请码</p>
                  <p className="text-2xl font-bold text-blue-600">{referralCode}</p>
                </div>
                <button
                  onClick={handleCopyReferralCode}
                  className="px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* 功能菜单 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">我的账户</h2>

          {/* 我的订单 */}
          <Card>
            <button
              onClick={() => router.push('/profile/orders')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">我的订单</span>
                  <span className="text-xs text-slate-500">查看订单历史</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 我的套餐 */}
          <Card>
            <button
              onClick={() => router.push('/profile/packages')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">我的套餐</span>
                  <span className="text-xs text-slate-500">套餐与使用记录</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 积分中心 */}
          <Card>
            <button
              onClick={() => router.push('/profile/points')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">积分中心</span>
                  <span className="text-xs text-slate-500">积分明细与兑换</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 我的优惠券 */}
          <Card>
            <button
              onClick={() => router.push('/profile/vouchers')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">我的优惠券</span>
                  <span className="text-xs text-slate-500">优惠券管理</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 邀请好友 */}
          <Card>
            <button
              onClick={() => router.push('/profile/referrals')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">邀请好友</span>
                  <span className="text-xs text-slate-500">邀请赚积分</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 我的评价 */}
          <Card>
            <button
              onClick={() => router.push('/profile/reviews')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-pink-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">我的评价</span>
                  <span className="text-xs text-slate-500">查看我的评价</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">账户设置</h2>

          {/* 编辑资料 */}
          <Card>
            <button
              onClick={() => router.push('/profile/edit')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-900 block">编辑资料</span>
                  <span className="text-xs text-slate-500">修改头像、姓名、联系方式</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 修改密码 */}
          <Card>
            <button
              onClick={() => router.push('/profile/password')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-900">修改密码</span>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* 退出登录 */}
          <Card>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-medium text-red-600">退出登录</span>
              </div>
            </button>
          </Card>
        </div>

        {/* 账户信息 */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              账户信息
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>注册时间</span>
                <span>{profile.created_at || profile.createdAt ? formatDate(profile.created_at || profile.createdAt!) : '未知'}</span>
              </div>
              <div className="flex justify-between">
                <span>账户类型</span>
                <Badge variant={profile.role === 'admin' ? 'blue' : 'neutral'}>
                  {profile.role === 'admin' ? '管理员' : '普通用户'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 退出登录确认弹窗 */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="确认退出"
      >
        <div className="space-y-4">
          <p className="text-slate-600">确定要退出登录吗？</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLogoutModal(false)}
              disabled={loggingOut}
            >
              取消
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
            >
              {loggingOut ? '退出中...' : '确认退出'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast 提示 */}
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
