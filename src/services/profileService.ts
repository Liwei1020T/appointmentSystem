import { MembershipTierId, getTierDefinitionById } from '@/lib/membership';
import { apiRequest } from '@/services/apiClient';

/**
 * Profile Service
 * 用户个人资料管理
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  points: number;
  tier?: MembershipTierId;
  totalSpent: number;
  createdAt: Date;
  role?: string;
  // snake_case aliases for backward compatibility
  full_name?: string;
  address?: string;
  avatar_url?: string;
  created_at?: Date | string;
}

export interface UpdateProfileParams {
  fullName?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  // snake_case aliases for backward compatibility
  full_name?: string;
  address?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

interface UserStatsPayload {
  totalOrders?: number;
  pendingOrders?: number;
  completedOrders?: number;
  activePackages?: number;
  remainingPackageCount?: number;
  availableVouchers?: number;
  points?: number;
  totalSpent?: number;
  membership?: MembershipTierInfo;
}

export interface PointsLogItem {
  id?: string;
  amount?: number;
  type?: string;
  description?: string;
  createdAt?: string | Date;
  created_at?: string | Date;
  balanceAfter?: number;
  balance_after?: number;
}

interface PointsResponsePayload {
  balance?: number | string | null;
  logs?: unknown;
}

export interface ReferralsSummary {
  referralCode?: string | null;
  referrals: Array<{
    id: string;
    createdAt?: string | null;
    rewardGiven?: boolean | null;
    referred?: {
      fullName?: string | null;
      createdAt?: string | null;
    } | null;
  }>;
  stats?: {
    totalReferrals?: number;
    totalRewards?: number;
    totalPointsEarned?: number;
  };
}

export interface MembershipDetails {
  currentTier: MembershipTierId;
  points: number;
  totalSpent: number;
  totalOrders: number;
  benefits: Array<{ description?: string | null; isActive?: boolean | null }>;
  progress: {
    nextTier: MembershipTierId | null;
    spentProgress: number;
    ordersProgress: number;
    spentTarget: number;
    ordersTarget: number;
  };
}

function normalizePointsResponse(payload: PointsResponsePayload | null | undefined): { balance: number; logs: PointsLogItem[] } {
  const balance = Number(payload?.balance ?? 0) || 0;
  const logs = Array.isArray(payload?.logs) ? (payload.logs as PointsLogItem[]) : [];
  return { balance, logs };
}

export async function getUserProfile(_userId?: string): Promise<{ profile?: UserProfile; error?: string }> {
  try {
    const profile = await apiRequest<UserProfile>(`/api/profile`);
    return { profile };
  } catch (error: unknown) {
    console.error('Failed to fetch user profile:', error);
    return { error: getErrorMessage(error, '加载失败') };
  }
}

export async function updateUserProfile(data: {
  fullName?: string;
  phone?: string;
  email?: string;
}): Promise<boolean> {
  try {
    await apiRequest(`/api/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return false;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest(`/api/profile/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to change password:', error);
    return { success: false, error: getErrorMessage(error, 'Network error') };
  }
}

/**
 * 更新用户资料
 */
export async function updateProfile(data: UpdateProfileParams): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiRequest(`/api/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error('Failed to update profile:', error);
    return { success: false, error: getErrorMessage(error, 'Network error') };
  }
}

/**
 * 用户统计信息
 */
export interface MembershipTierInfo {
  tier: MembershipTierId;
  label: string;
  description: string;
  discountRate: number;
  progress: number;
  nextTier?: {
    id: MembershipTierId;
    label: string;
    minSpend: number;
  } | null;
}

export interface UserStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  activePackages: number;
  remainingPackageCount: number;
  availableVouchers: number;
  totalPoints: number;
  totalSpent: number;
  membership: MembershipTierInfo;
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(): Promise<UserStats> {
  const fallbackTier = getTierDefinitionById('SILVER');
  const fallbackMembership = fallbackTier
    ? {
        tier: fallbackTier.id,
        label: fallbackTier.label,
        description: fallbackTier.description,
        discountRate: fallbackTier.discountRate,
        progress: 0,
        nextTier: null,
      }
    : {
        tier: 'SILVER' as MembershipTierId,
        label: 'Silver',
        description: '',
        discountRate: 0,
        progress: 0,
        nextTier: null,
      };
  try {
    const data = await apiRequest<UserStatsPayload>(`/api/user/stats`);
    const membership = data?.membership || fallbackMembership;

    return {
      totalOrders: data?.totalOrders || 0,
      pendingOrders: data?.pendingOrders || 0,
      completedOrders: data?.completedOrders || 0,
      activePackages: data?.activePackages || 0,
      remainingPackageCount: data?.remainingPackageCount || 0,
      availableVouchers: data?.availableVouchers || 0,
      totalPoints: data?.points || 0,
      totalSpent: data?.totalSpent || 0,
      membership,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      activePackages: 0,
      remainingPackageCount: 0,
      availableVouchers: 0,
      totalPoints: 0,
      totalSpent: 0,
      membership: fallbackMembership,
    };
  }
}

/**
 * 生成推荐码
 */
export async function generateReferralCode(): Promise<{ code: string; error: string | null }> {
  try {
    const result = await apiRequest<{ code: string }>(`/api/profile/referral-code`, {
      method: 'POST',
    });
    return { code: result.code, error: null };
  } catch (error: unknown) {
    console.error('Failed to generate referral code:', error);
    return { code: '', error: getErrorMessage(error, 'Network error') };
  }
}

/**
 * 用户登出
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: true, callbackUrl: '/login' });
    return { success: true };
  } catch (error) {
    console.error('Failed to logout:', error);
    return { success: false };
  }
}

/**
 * 获取用户积分信息
 */
export async function getPoints(): Promise<{ balance: number; logs: PointsLogItem[] }> {
  const payload = await apiRequest<PointsResponsePayload>(`/api/points`);
  return normalizePointsResponse(payload);
}

/**
 * 获取推荐记录
 */
export async function getReferrals(): Promise<ReferralsSummary> {
  const payload = await apiRequest<ReferralsSummary>(`/api/referrals`);
  return {
    referralCode: payload?.referralCode ?? null,
    referrals: Array.isArray(payload?.referrals) ? payload.referrals : [],
    stats: payload?.stats,
  };
}

/**
 * 获取会员详情
 */
export async function getMembershipDetails(): Promise<MembershipDetails | null> {
  try {
    const data = await apiRequest<MembershipDetails>('/api/profile/membership');
    return data;
  } catch (error) {
    console.error('Failed to fetch membership details:', error);
    return null;
  }
}

/**
 * 用户徽章
 */
export interface UserBadge {
  type: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface BadgesData {
  earnedBadges: UserBadge[];
  allBadges: UserBadge[];
  totalEarned: number;
  totalAvailable: number;
}

/**
 * 获取用户徽章
 */
export async function getUserBadges(): Promise<BadgesData | null> {
  try {
    const data = await apiRequest<BadgesData>('/api/profile/badges');
    return data;
  } catch (error) {
    console.error('Failed to fetch user badges:', error);
    return null;
  }
}
