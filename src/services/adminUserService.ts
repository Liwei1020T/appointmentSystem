/**
 * Admin User Service
 * 管理用户CRUD操作
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  full_name?: string;
  phone?: string;
  points: number;
  role: string;
  isBlocked?: boolean;
  is_blocked?: boolean;
  blockedReason?: string;
  blocked_reason?: string;
  referralCode?: string;
  referral_code?: string;
  referredBy?: string;
  referred_by?: string;
  avatar?: string;
  avatar_url?: string;
  createdAt: Date;
  created_at?: Date;
  updatedAt?: Date;
  updated_at?: Date;
}

export async function getAllUsers(filters?: {
  role?: string;
  status?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ users: User[]; totalCount: number; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('limit', filters.pageSize.toString());

    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { users: [], totalCount: 0, error: data.error || 'Failed to fetch users' };
    }
    const payload = data?.data ?? data;
    const rawUsers = Array.isArray(payload?.users) ? payload.users : [];
    const normalizedUsers: User[] = rawUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      points: Number(u.points ?? 0) || 0,
      role: u.role,
      referralCode: u.referralCode,
      referral_code: u.referralCode,
      referredBy: u.referredBy,
      referred_by: u.referredBy,
      fullName: u.fullName,
      full_name: u.fullName,
      createdAt: u.createdAt,
      created_at: u.createdAt,
      updatedAt: u.updatedAt,
      updated_at: u.updatedAt,
      // Not modeled yet
      isBlocked: false,
      is_blocked: false,
    }));

    const totalCount = Number(payload?.pagination?.total ?? payload?.total ?? 0) || 0;
    return { users: normalizedUsers, totalCount, error: null };
  } catch (error: any) {
    return { users: [], totalCount: 0, error: error.message || 'Failed to fetch users' };
  }
}

export async function getUserById(userId: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to fetch user' };
    }
    const payload = data?.data ?? data;
    const u = payload?.user ?? payload;
    if (!u?.id) return { user: null, error: 'User not found' };
    const normalized: User = {
      id: u.id,
      email: u.email,
      phone: u.phone,
      points: Number(u.points ?? 0) || 0,
      role: u.role,
      fullName: u.fullName ?? u.full_name,
      full_name: u.fullName ?? u.full_name,
      referralCode: u.referralCode ?? u.referral_code,
      referral_code: u.referralCode ?? u.referral_code,
      referredBy: u.referredBy ?? u.referred_by,
      referred_by: u.referredBy ?? u.referred_by,
      createdAt: u.createdAt ?? u.created_at,
      created_at: u.createdAt ?? u.created_at,
      updatedAt: u.updatedAt ?? u.updated_at,
      updated_at: u.updatedAt ?? u.updated_at,
      isBlocked: Boolean(u.isBlocked ?? u.is_blocked ?? false),
      is_blocked: Boolean(u.isBlocked ?? u.is_blocked ?? false),
    };
    return { user: normalized, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to fetch user' };
  }
}

export async function updateUser(userId: string, data: Partial<User>): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to update user:', error);
    return false;
  }
}

export async function addPointsToUser(userId: string, points: number, reason: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to add points:', error);
    return false;
  }
}

/**
 * 获取用户订单列表
 */
export interface UserOrder {
  id: string;
  orderNumber: string;
  order_number?: string;
  status: string;
  totalAmount: number;
  total_amount?: number;
  price?: number;
  tension?: number;
  string?: { name: string; brand: string };
  use_package?: boolean;
  usePackage?: boolean;
  createdAt: Date;
  created_at?: Date;
  items: { name: string; quantity: number; price: number }[];
}

export async function getUserOrders(userId: string, filters?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: UserOrder[]; total: number; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/admin/users/${userId}/orders?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: [], total: 0, error: data.error || 'Failed to fetch user orders' };
    }
    const payload = data?.data ?? data;
    return { data: payload?.data || [], total: payload?.total || 0, error: null };
  } catch (error: any) {
    return { data: [], total: 0, error: error.message || 'Failed to fetch user orders' };
  }
}

/**
 * 获取用户套餐列表
 */
export interface UserPackage {
  id: string;
  packageId: string;
  package_id?: string;
  packageName: string;
  package_name?: string;
  package?: { name: string; times?: number };
  remainingSessions: number;
  remaining_sessions?: number;
  remaining?: number;
  totalSessions: number;
  total_sessions?: number;
  purchaseDate: Date;
  purchase_date?: Date;
  expiryDate?: Date;
  expiry_date?: Date;
  expiry?: Date;
  status: string;
}

export async function getUserPackages(userId: string): Promise<{ data: UserPackage[]; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/packages`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch user packages' };
    }
    const payload = data?.data ?? data;
    return { data: payload?.data || payload || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch user packages' };
  }
}

/**
 * 获取用户优惠券列表
 */
export interface UserVoucher {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discount_type?: 'percentage' | 'fixed';
  discountValue: number;
  discount_value?: number;
  voucher?: { code: string; type?: string; value?: number };
  expiryDate?: Date;
  expiry_date?: Date;
  isUsed: boolean;
  is_used?: boolean;
  usedAt?: Date;
  used_at?: Date;
  status?: string;
}

export async function getUserVouchers(userId: string): Promise<{ data: UserVoucher[]; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/vouchers`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch user vouchers' };
    }
    const payload = data?.data ?? data;
    return { data: payload?.data || payload || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch user vouchers' };
  }
}

/**
 * 获取用户积分记录
 */
export interface PointsLogEntry {
  id: string;
  points: number;
  amount?: number;
  type: 'earned' | 'spent' | 'adjusted';
  source?: string;
  reason: string;
  createdAt: Date;
  created_at?: Date;
  balanceAfter: number;
  balance_after?: number;
}

// Alias for backward compatibility
export type PointsLog = PointsLogEntry;

// User role type
export type UserRole = 'user' | 'admin' | 'super_admin' | string;

// User status type
export type UserStatus = 'all' | 'active' | 'blocked' | string;

export async function getUserPointsLog(userId: string, filters?: {
  page?: number;
  limit?: number;
}): Promise<{ data: PointsLogEntry[]; total: number; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/admin/users/${userId}/points-log?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: [], total: 0, error: data.error || 'Failed to fetch points log' };
    }
    const payload = data?.data ?? data;
    return { data: payload?.data || [], total: payload?.total || 0, error: null };
  } catch (error: any) {
    return { data: [], total: 0, error: error.message || 'Failed to fetch points log' };
  }
}

/**
 * 更新用户积分
 */
export async function updateUserPoints(userId: string, points: number, reason: string, type: 'add' | 'subtract' | 'set'): Promise<{ success: boolean; newBalance?: number; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/points`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason, type }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update user points' };
    }
    const payload = data?.data ?? data;
    return { success: true, newBalance: payload?.newBalance, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user points' };
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update user role' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user role' };
  }
}

/**
 * 封禁/解封用户
 */
export async function blockUser(userId: string, blocked: boolean, reason?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/users/${userId}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked, reason }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update user block status' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user block status' };
  }
}

/**
 * 获取用户统计数据
 */
export interface UserStats {
  totalUsers: number;
  total_users?: number;
  newUsersToday: number;
  new_users_today?: number;
  newUsersThisWeek: number;
  new_users_this_week?: number;
  newUsersThisMonth: number;
  new_users_this_month?: number;
  activeUsersToday: number;
  active_users_today?: number;
  activeUsersThisWeek: number;
  active_users_this_week?: number;
  activeUsers?: number;
  active_users?: number;
  blockedUsers: number;
  blocked_users?: number;
  totalOrders?: number;
  total_orders?: number;
  totalRevenue?: number;
  total_revenue?: number;
  totalPointsDistributed?: number;
  total_points_distributed?: number;
  usersByRole: { role: string; count: number }[];
  users_by_role?: { role: string; count: number }[];
}

export async function getUserStats(): Promise<{ data: UserStats; error: string | null }> {
  try {
    const response = await fetch('/api/admin/users/stats');
    const data = await response.json();
    if (!response.ok) {
      return { 
        data: { 
          totalUsers: 0, 
          newUsersToday: 0, 
          newUsersThisWeek: 0, 
          newUsersThisMonth: 0, 
          activeUsersToday: 0, 
          activeUsersThisWeek: 0, 
          blockedUsers: 0, 
          usersByRole: [] 
        }, 
        error: data.error || 'Failed to fetch user stats' 
      };
    }
    return { 
      data: data.data || { 
        totalUsers: 0, 
        newUsersToday: 0, 
        newUsersThisWeek: 0, 
        newUsersThisMonth: 0, 
        activeUsersToday: 0, 
        activeUsersThisWeek: 0, 
        blockedUsers: 0, 
        usersByRole: [] 
      }, 
      error: null 
    };
  } catch (error: any) {
    return { 
      data: { 
        totalUsers: 0, 
        newUsersToday: 0, 
        newUsersThisWeek: 0, 
        newUsersThisMonth: 0, 
        activeUsersToday: 0, 
        activeUsersThisWeek: 0, 
        blockedUsers: 0, 
        usersByRole: [] 
      }, 
      error: error.message || 'Failed to fetch user stats' 
    };
  }
}
