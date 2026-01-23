/**
 * Referral Service
 * 处理推荐/邀请相关逻辑
 */

import { apiRequest } from '@/services/apiClient';

export interface ReferralLog {
  id: string;
  referrer_id?: string;
  referred_id?: string;
  referrerId?: string;
  referredId?: string;
  created_at: string;
  createdAt?: string | Date;
  reward_given: boolean;
  rewardGiven?: boolean;
  reward_points?: number;
  rewardPoints?: number;
  referred?: {
    id?: string;
    full_name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalRewards: number;
  referrals: Array<{
    id: string;
    fullName: string;
    createdAt: Date;
    rewardPoints: number;
  }>;
}

/**
 * 获取用户的推荐统计
 */
export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const data = await apiRequest<any>(`/api/referrals`);
    return {
      referralCode: data?.referralCode || '',
      totalReferrals: data?.stats?.totalReferrals || 0,
      totalRewards: data?.stats?.totalRewards || 0,
      referrals: data?.referrals || [],
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return {
      referralCode: '',
      totalReferrals: 0,
      totalRewards: 0,
      referrals: [],
    };
  }
}

/**
 * 生成推荐链接
 */
export function generateReferralLink(referralCode: string): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const browserBase = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = envBase || browserBase;
  if (!baseUrl) return '';
  return `${baseUrl}/signup?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * 复制推荐码到剪贴板
 */
export async function copyReferralCode(referralCode: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(referralCode);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy referral code:', error);
    return false;
  }
}

/**
 * 复制推荐链接到剪贴板
 */
export async function copyReferralLink(referralCode: string): Promise<boolean> {
  try {
    const link = generateReferralLink(referralCode);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy referral link:', error);
    return false;
  }
}

/**
 * 获取当前用户的推荐码
 */
export async function getMyReferralCode(): Promise<{ code: string | null; error: string | null }> {
  try {
    const stats = await getReferralStats();
    return { code: stats.referralCode || null, error: null };
  } catch (error: any) {
    return { code: null, error: error.message || 'Failed to get referral code' };
  }
}

/**
 * 生成分享链接
 */
export async function generateShareLink(referralCode?: string): Promise<{ link: string | null; error: string | null }> {
  try {
    let code = referralCode;
    if (!code) {
      const result = await getMyReferralCode();
      if (result.error || !result.code) {
        return { link: null, error: result.error || 'No referral code' };
      }
      code = result.code;
    }
    return { link: generateReferralLink(code), error: null };
  } catch (err: any) {
    return { link: null, error: err.message || '生成失败' };
  }
}

/**
 * 同步生成分享链接 (需要提供referralCode)
 */
export function generateShareLinkSync(referralCode: string): string {
  return generateReferralLink(referralCode);
}

/**
 * 生成分享消息
 */
export async function generateShareMessage(referralCode?: string): Promise<{ message: string | null; error: string | null }> {
  try {
    let code = referralCode;
    if (!code) {
      const result = await getMyReferralCode();
      if (result.error || !result.code) {
        return { message: null, error: result.error || 'No referral code' };
      }
      code = result.code;
    }
    const link = generateReferralLink(code);
    const msg = `Join me at LW String Studio! Use my referral code: ${code} or sign up here: ${link}`;
    return { message: msg, error: null };
  } catch (err: any) {
    return { message: null, error: err.message || '生成失败' };
  }
}

/**
 * 同步生成分享消息 (需要提供referralCode)
 */
export function generateShareMessageSync(referralCode: string): string {
  const link = generateReferralLink(referralCode);
  return `Join me at LW String Studio! Use my referral code: ${referralCode} or sign up here: ${link}`;
}

/**
 * 我的推荐统计信息
 */
export interface MyReferralStats {
  referralCode: string;
  referralCount: number;
  totalPoints: number;
  pendingRewards: number;
  referrals: Array<{
    id: string;
    fullName: string;
    createdAt: Date;
    status: 'pending' | 'completed';
    rewardPoints: number;
  }>;
}

/**
 * 获取我的推荐统计
 */
export async function getMyReferralStats(): Promise<MyReferralStats> {
  try {
    const data = await apiRequest<any>(`/api/referrals/my-stats`);
    return {
      referralCode: data.referralCode || '',
      referralCount: data.referralCount || 0,
      totalPoints: data.totalPoints || 0,
      pendingRewards: data.pendingRewards || 0,
      referrals: data.referrals || [],
    };
  } catch (error) {
    console.error('Error fetching my referral stats:', error);
    return {
      referralCode: '',
      referralCount: 0,
      totalPoints: 0,
      pendingRewards: 0,
      referrals: [],
    };
  }
}

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  referralCount: number;
  totalPoints: number;
  isCurrentUser?: boolean;
}

/**
 * 获取推荐排行榜
 */
export async function getReferralLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const data = await apiRequest<{ leaderboard: any[] }>(`/api/referrals/leaderboard?limit=${limit}`);
    return (data.leaderboard || []).map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.userId || '',
      fullName: entry.fullName || 'Anonymous',
      referralCount: entry.referralCount || 0,
      totalPoints: entry.totalPoints || 0,
      isCurrentUser: entry.isCurrentUser || false,
    }));
  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    return [];
  }
}
