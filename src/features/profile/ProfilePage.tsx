/**
 * 个人资料页面 (Profile Page)
 * 
 * 定位：管理中心
 * - 账户设置、会员权益、历史记录
 * - 与首页（操作中心）差异化设计
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
  getMembershipDetails,
  UserProfile,
} from '@/services/profileService';
import { Card, Badge, Button, Modal, Toast } from '@/components';
import MembershipCard, { MembershipTier } from '@/components/MembershipCard';
import InlineLoading from '@/components/loading/InlineLoading';
import { ProfileSkeleton } from '@/components/skeletons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { isAdminRole } from '@/lib/roles';

// 图标组件 - 统一使用橙色主题
const ChevronRightIcon = () => (
  <svg className="w-5 h-5 text-text-tertiary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [membershipData, setMembershipData] = useState<any>(null);
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [profileResult, statsResult, codeResult, membershipResult] = await Promise.all([
        getUserProfile(),
        getUserStats(),
        generateReferralCode(),
        getMembershipDetails(),
      ]);

      if (profileResult.error) {
        setError(profileResult.error?.message || profileResult.error);
      } else {
        setProfile(profileResult.profile || null);
      }

      setStats(statsResult);
      setMembershipData(membershipResult);

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

  const handleCopyReferralCode = async () => {
    if (!referralCode) {
      setToast({ show: true, message: '暂无可复制的邀请码', type: 'warning' });
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralCode;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setToast({ show: true, message: '邀请码已复制到剪贴板', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: '复制失败，请手动选择并复制', type: 'error' });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { success } = await logout();
      if (success) {
        router.push('/login');
      } else {
        setToast({ show: true, message: '退出登录失败', type: 'error' });
      }
    } catch (err: any) {
      setToast({ show: true, message: err.message || '退出登录失败', type: 'error' });
    } finally {
      setLoggingOut(false);
    }
  };

  if (authLoading || loading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      {/* ========== 顶部个人信息区 - 卡片化设计 ========== */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-accent/15 via-emerald-50 to-transparent" />
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 relative">
          <div className="flex items-center gap-4 bg-white/90 rounded-2xl border border-border-subtle shadow-lg p-5 backdrop-blur">
            {/* 头像 */}
            <div className="relative">
              <div className="w-20 h-20 bg-accent text-text-onAccent rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden ring-4 ring-white/60 shadow-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  (profile.full_name || profile.fullName || 'U').charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">{profile.full_name || profile.fullName || '用户'}</h1>
              <p className="text-text-secondary text-sm">{profile.email}</p>
              {profile.phone && <p className="text-text-tertiary text-sm">{profile.phone}</p>}
            </div>

            {/* 编辑按钮 */}
            <button
              onClick={() => router.push('/profile/edit')}
              className="w-10 h-10 bg-ink hover:bg-ink/80 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ========== 主内容区 ========== */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4 relative z-20">

        {/* 错误提示 */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* ========== 会员权益卡片 - 强化设计 ========== */}
        {membershipData && (
          <MembershipCard
            currentTier={membershipData.currentTier}
            points={membershipData.points}
            totalSpent={membershipData.totalSpent}
            nextTier={membershipData.progress.nextTier}
            spentProgress={membershipData.progress.spentProgress}
            ordersProgress={membershipData.progress.ordersProgress}
            spentTarget={membershipData.progress.spentTarget}
            ordersTarget={membershipData.progress.ordersTarget}
            benefits={membershipData.benefits}
          />
        )}

        {/* ========== 快捷入口 - 紧凑设计 ========== */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-sm border border-border-subtle p-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => router.push('/profile/orders')}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-accent-soft transition-colors group"
              >
                <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-secondary">订单</span>
                <span className="text-lg font-bold text-text-primary font-mono">{stats.totalOrders}</span>
              </button>

              <button
                onClick={() => router.push('/packages?tab=my')}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-accent-soft transition-colors group"
              >
                <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-secondary">套餐</span>
                <span className="text-lg font-bold text-text-primary font-mono">{stats.activePackages}</span>
              </button>

              <button
                onClick={() => router.push('/profile/vouchers')}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-accent-soft transition-colors group"
              >
                <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-5 h-5 text-accent" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-text-secondary">优惠券</span>
                <span className="text-lg font-bold text-text-primary font-mono">{stats.availableVouchers}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== 积分活动区 ========== */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <span className="w-1 h-4 bg-accent rounded-full" />
              积分活动
            </h2>
          </div>

          {/* 积分中心 */}
          <button
            onClick={() => router.push('/points')}
            className="w-full p-4 flex items-center justify-between hover:bg-ink transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-medium text-text-primary block">积分中心</span>
                <span className="text-xs text-text-tertiary">积分明细与兑换</span>
              </div>
            </div>
            <ChevronRightIcon />
          </button>

          {/* 邀请好友 */}
          <button
            onClick={() => router.push('/profile/referrals')}
            className="w-full p-4 flex items-center justify-between hover:bg-ink transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-medium text-text-primary block">邀请好友</span>
                <span className="text-xs text-text-tertiary">
                  邀请码:
                  {referralCode ? (
                    <span className="ml-1 font-mono text-accent font-bold">{referralCode}</span>
                  ) : (
                    <InlineLoading label="加载中..." size="sm" className="ml-1" />
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {referralCode && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyReferralCode(); }}
                  className="px-3 py-1 bg-accent text-text-onAccent text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors"
                >
                  复制
                </button>
              )}
              <ChevronRightIcon />
            </div>
          </button>
        </div>

        {/* ========== 我的评价 ========== */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
          <button
            onClick={() => router.push('/reviews')}
            className="w-full p-4 flex items-center justify-between hover:bg-ink transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-medium text-text-primary block">我的评价</span>
                <span className="text-xs text-text-tertiary">查看我的评价记录</span>
              </div>
            </div>
            <ChevronRightIcon />
          </button>
        </div>

        {/* ========== 账户设置区 ========== */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <span className="w-1 h-4 bg-ink rounded-full" />
              账户设置
            </h2>
          </div>

          {/* 编辑资料 */}
          <button
            onClick={() => router.push('/profile/edit')}
            className="w-full p-4 flex items-center justify-between hover:bg-ink transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-text-secondary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-medium text-text-primary block">编辑资料</span>
                <span className="text-xs text-text-tertiary">修改头像、姓名、联系方式</span>
              </div>
            </div>
            <ChevronRightIcon />
          </button>

          {/* 修改密码 */}
          <button
            onClick={() => router.push('/profile/password')}
            className="w-full p-4 flex items-center justify-between hover:bg-ink transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-text-secondary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <span className="font-medium text-text-primary">修改密码</span>
            </div>
            <ChevronRightIcon />
          </button>

          {/* 退出登录 */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-danger/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-danger" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="font-medium text-danger">退出登录</span>
            </div>
          </button>
        </div>

        {/* ========== 账户信息 ========== */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">账户信息</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>注册时间</span>
              <span className="text-text-primary">{profile.created_at || profile.createdAt ? formatDate(profile.created_at || profile.createdAt!) : '未知'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>账户类型</span>
              <Badge variant={isAdminRole(profile.role) ? 'info' : 'neutral'}>
                {isAdminRole(profile.role) ? '管理员' : '普通用户'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 退出登录弹窗 ========== */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="确认退出"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">确定要退出登录吗？</p>
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

      {/* ========== Toast 提示 ========== */}
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
