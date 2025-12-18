import { MembershipTierId } from '@/lib/membership';

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
    const response = await fetch('/api/profile');
    if (!response.ok) {
      const errorData = await response.json();
      return { error: new Error(errorData.error || 'Failed to fetch profile') };
    }
    const payload = await response.json();
    // API routes use { success, data } wrappers; keep backward compatibility if unwrapped.
    const profile = payload?.data ?? payload;
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
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
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
    const response = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * 更新用户资料
 */
export async function updateProfile(data: UpdateProfileParams): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to update profile' };
    }
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
    const response = await fetch('/api/user/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    const payload = await response.json();
    // API routes use { success, data } wrappers; keep backward compatibility if unwrapped.
    const data = payload?.data ?? payload;
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
    const response = await fetch('/api/profile/referral-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { code: '', error: errorData.error || 'Failed to generate referral code' };
    }
    const payload = await response.json();
    const code = payload?.data?.code ?? payload?.code ?? '';
    return { code, error: null };
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
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return { success: response.ok };
  } catch (error) {
    console.error('Failed to logout:', error);
    return { success: false };
  }
}
