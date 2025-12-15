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
    const profile = await response.json();
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
export interface UserStats {
  totalOrders: number;
  totalPoints: number;
  totalSpent: number;
  activeVouchers: number;
  referralCount: number;
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const response = await fetch('/api/profile/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    const data = await response.json();
    return {
      totalOrders: data.totalOrders || 0,
      totalPoints: data.totalPoints || 0,
      totalSpent: data.totalSpent || 0,
      activeVouchers: data.activeVouchers || 0,
      referralCount: data.referralCount || 0,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return {
      totalOrders: 0,
      totalPoints: 0,
      totalSpent: 0,
      activeVouchers: 0,
      referralCount: 0,
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
    const data = await response.json();
    return { code: data.code || '', error: null };
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
