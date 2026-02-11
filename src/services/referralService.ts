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

type ReferralStatsItem = ReferralStats['referrals'][number];
type MyReferralStatsItem = MyReferralStats['referrals'][number];

interface ReferralStatsPayload {
  referralCode?: unknown;
  stats?: {
    totalReferrals?: unknown;
    totalRewards?: unknown;
  } | null;
  referrals?: unknown;
}

interface MyReferralStatsPayload {
  referralCode?: unknown;
  referralCount?: unknown;
  totalPoints?: unknown;
  pendingRewards?: unknown;
  referrals?: unknown;
}

interface LeaderboardEntryPayload {
  userId?: unknown;
  fullName?: unknown;
  referralCount?: unknown;
  totalPoints?: unknown;
  isCurrentUser?: unknown;
}

interface ReferralLeaderboardPayload {
  leaderboard?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return fallback;
}

function toDate(value: unknown, fallback = new Date(0)): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (isRecord(error) && typeof error.message === 'string' && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeReferralStatsItems(input: unknown): ReferralStatsItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item): ReferralStatsItem | null => {
      if (!isRecord(item)) {
        return null;
      }

      return {
        id: toString(item.id),
        fullName: toString(item.fullName, 'User'),
        createdAt: toDate(item.createdAt),
        rewardPoints: toNumber(item.rewardPoints),
      };
    })
    .filter((item): item is ReferralStatsItem => item !== null);
}

function normalizeMyReferralStatsItems(input: unknown): MyReferralStatsItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item): MyReferralStatsItem | null => {
      if (!isRecord(item)) {
        return null;
      }

      const status = item.status === 'completed' ? 'completed' : 'pending';
      return {
        id: toString(item.id),
        fullName: toString(item.fullName, 'User'),
        createdAt: toDate(item.createdAt),
        status,
        rewardPoints: toNumber(item.rewardPoints),
      };
    })
    .filter((item): item is MyReferralStatsItem => item !== null);
}

/**
 * 获取用户的推荐统计
 */
export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const data = await apiRequest<ReferralStatsPayload>(`/api/referrals`);
    return {
      referralCode: toString(data.referralCode),
      totalReferrals: toNumber(data.stats?.totalReferrals),
      totalRewards: toNumber(data.stats?.totalRewards),
      referrals: normalizeReferralStatsItems(data.referrals),
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
  } catch (error: unknown) {
    return { code: null, error: getErrorMessage(error, 'Failed to get referral code') };
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
  } catch (error: unknown) {
    return { link: null, error: getErrorMessage(error, '生成失败') };
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
  } catch (error: unknown) {
    return { message: null, error: getErrorMessage(error, '生成失败') };
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
    const data = await apiRequest<MyReferralStatsPayload>(`/api/referrals/my-stats`);
    return {
      referralCode: toString(data.referralCode),
      referralCount: toNumber(data.referralCount),
      totalPoints: toNumber(data.totalPoints),
      pendingRewards: toNumber(data.pendingRewards),
      referrals: normalizeMyReferralStatsItems(data.referrals),
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
    const data = await apiRequest<ReferralLeaderboardPayload>(`/api/referrals/leaderboard?limit=${limit}`);
    const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];

    return leaderboard.map((entry, index: number) => {
      const payload: LeaderboardEntryPayload = isRecord(entry) ? entry : {};
      return {
        rank: index + 1,
        userId: toString(payload.userId),
        fullName: toString(payload.fullName, 'Anonymous'),
        referralCount: toNumber(payload.referralCount),
        totalPoints: toNumber(payload.totalPoints),
        isCurrentUser: toBoolean(payload.isCurrentUser),
      };
    });
  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    return [];
  }
}
