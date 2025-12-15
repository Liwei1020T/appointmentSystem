/**
 * Profile Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  points: number;
  referralCode: string;
  referredBy: string | null;
  role: string;
  createdAt: Date;
  stats: {
    totalOrders: number;
    activePackages: number;
    activeVouchers: number;
  };
}

export interface UpdateProfileData {
  fullName?: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
  avatar_url?: string;
}

/**
 * 获取用户个人资料
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await fetch('/api/profile');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取个人资料失败');
  }

  return data.data;
}

/**
 * 更新用户个人资料
 */
export async function updateProfile(profileData: UpdateProfileData): Promise<{ profile?: UserProfile; error?: string }> {
  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || '更新资料失败' };
    }

    return { profile: data.data };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { error: '更新资料失败' };
  }
}

/**
 * 获取用户积分信息
 */
export async function getPoints(): Promise<{ balance: number; logs: any[] }> {
  const response = await fetch('/api/points');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取积分失败');
  }

  return data.data;
}

/**
 * 获取推荐记录
 */
export async function getReferrals(): Promise<any> {
  const response = await fetch('/api/referrals');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取推荐记录失败');
  }

  return data.data;
}
