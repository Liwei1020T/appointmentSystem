import { MembershipTierId } from '@/lib/membership';
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

export async function getUserProfile(userId?: string): Promise<{ profile?: UserProfile; error?: any }> {
  try {
    const profile = await apiRequest<UserProfile>(`/api/profile`);
    return { profile };
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    return { error };
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
  } catch (error: any) {
    console.error('Failed to change password:', error);
    return { success: false, error: error.message || 'Network error' };
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
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return { success: false, error: error.message || 'Network error' };
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
  try {
    const data = await apiRequest<any>(`/api/user/stats`);
    const membership = data?.membership || {
      tier: 'standard' as MembershipTierId,
      label: '普通会员',
      description: '尚未达到会员门槛，继续消费即可升级',
      discountRate: 0,
      progress: 0,
      nextTier: null,
    };

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
      membership: {
        tier: 'standard',
        label: '普通会员',
        description: '尚未达到会员门槛，继续消费即可升级',
        discountRate: 0,
        progress: 0,
        nextTier: null,
      },
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
  } catch (error: any) {
    console.error('Failed to generate referral code:', error);
    return { code: '', error: error.message || 'Network error' };
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
export async function getPoints(): Promise<{ balance: number; logs: any[] }> {
  return apiRequest(`/api/points`);
}

/**
 * 获取推荐记录
 */
export async function getReferrals(): Promise<any> {
  return apiRequest(`/api/referrals`);
}
