/**
 * Admin Voucher Service
 * 管理员优惠券管理功能
 */

export type VoucherType = 'FIXED' | 'PERCENTAGE' | 'fixed' | 'percentage' | 'fixed_amount' | 'percentage_off' | string;
export type VoucherStatus = 'all' | 'active' | 'inactive' | 'expired' | string;

export interface DistributionTarget {
  type: 'all' | 'specific' | 'tier';
  userIds?: string[];
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | string;
}

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minPurchase: number;
  min_purchase?: number;
  maxDiscount?: number;
  max_discount?: number;
  startDate?: Date;
  start_date?: Date;
  endDate?: Date;
  end_date?: Date;
  usageLimit?: number;
  usage_limit?: number;
  usageCount?: number;
  usage_count?: number;
  isActive?: boolean;
  is_active?: boolean;
  active?: boolean;
  // Additional fields
  points_cost?: number;
  pointsCost?: number;
  description?: string;
  valid_from?: string | Date;
  validFrom?: string | Date;
  valid_until?: string | Date;
  validUntil?: string | Date;
  created_at?: Date;
  createdAt?: Date;
  updated_at?: Date;
  updatedAt?: Date;
}

export interface GetVouchersFilter {
  status?: VoucherStatus;
  type?: VoucherType;
  searchTerm?: string;
}

export async function getAllVouchers(filters?: GetVouchersFilter): Promise<{ vouchers: Voucher[]; data?: Voucher[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    
    const queryString = params.toString();
    const url = queryString ? `/api/admin/vouchers?${queryString}` : '/api/admin/vouchers';
    
    const response = await fetch(url);
    const data = await response.json();
    const vouchers = data.vouchers || [];
    return { vouchers, data: vouchers, error: null };
  } catch (error) {
    console.error('Failed to fetch vouchers:', error);
    return { vouchers: [], data: [], error: 'Failed to fetch vouchers' };
  }
}

export async function getVoucherById(voucherId: string): Promise<{ voucher: Voucher | null; data?: Voucher | null; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/${voucherId}`);
    if (!response.ok) return { voucher: null, data: null, error: 'Voucher not found' };
    const voucher = await response.json();
    return { voucher, data: voucher, error: null };
  } catch (error) {
    console.error('Failed to fetch voucher:', error);
    return { voucher: null, data: null, error: 'Failed to fetch voucher' };
  }
}

export async function createVoucher(data: Partial<Voucher>): Promise<{ voucher: Voucher | null; success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return { voucher: null, success: false, error: 'Failed to create voucher' };
    }
    const voucher = await response.json();
    return { voucher, success: true, error: null };
  } catch (error) {
    console.error('Failed to create voucher:', error);
    return { voucher: null, success: false, error: 'Failed to create voucher' };
  }
}

export async function updateVoucher(
  voucherId: string,
  data: Partial<Voucher>
): Promise<{ voucher: Voucher | null; success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return { voucher: null, success: false, error: 'Failed to update voucher' };
    }
    const voucher = await response.json();
    return { voucher, success: true, error: null };
  } catch (error) {
    console.error('Failed to update voucher:', error);
    return { voucher: null, success: false, error: 'Failed to update voucher' };
  }
}

export async function distributeVoucher(
  voucherId: string,
  target: DistributionTarget | string[]
): Promise<{ success: boolean; count?: number; error: string | null }> {
  try {
    // Handle both old array format and new target format
    const body = Array.isArray(target) 
      ? { userIds: target }
      : target;
    
    const response = await fetch(`/api/admin/vouchers/${voucherId}/distribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to distribute voucher' };
    }
    
    const data = await response.json();
    return { success: true, count: data.count || 0, error: null };
  } catch (error) {
    console.error('Failed to distribute voucher:', error);
    return { success: false, error: 'Failed to distribute voucher' };
  }
}

export async function deleteVoucher(voucherId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      return { success: false, error: 'Failed to delete voucher' };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to delete voucher:', error);
    return { success: false, error: 'Failed to delete voucher' };
  }
}

export interface UserVoucher {
  id: string;
  voucherId: string;
  voucher_id?: string;
  userId: string;
  user_id?: string;
  code: string;
  isUsed: boolean;
  is_used?: boolean;
  usedAt?: Date;
  used_at?: Date;
  createdAt?: Date;
  created_at?: Date;
  status?: 'used' | 'expired' | 'available' | string;
  user?: {
    id: string;
    name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export async function getUserVouchers(userId: string): Promise<{ data: UserVoucher[]; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/user/${userId}`);
    const data = await response.json();
    return { data: data.vouchers || [], error: null };
  } catch (error) {
    console.error('Failed to fetch user vouchers:', error);
    return { data: [], error: 'Failed to fetch user vouchers' };
  }
}

export async function toggleVoucherStatus(voucherId: string, active?: boolean): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/${voucherId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (!response.ok) {
      return { success: false, error: 'Failed to toggle voucher status' };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to toggle voucher status:', error);
    return { success: false, error: 'Failed to toggle voucher status' };
  }
}

export interface VoucherStats {
  totalVouchers: number;
  total_vouchers?: number;
  activeVouchers: number;
  active_vouchers?: number;
  totalRedemptions: number;
  total_redemptions?: number;
  totalDiscount: number;
  total_discount?: number;
  inactiveVouchers?: number;
  inactive_vouchers?: number;
  expiredVouchers?: number;
  expired_vouchers?: number;
  // Additional stats used by component
  total_distributed?: number;
  totalDistributed?: number;
  total_used?: number;
  totalUsed?: number;
  usage_rate?: number;
  usageRate?: number;
  total_discount_given?: number;
  totalDiscountGiven?: number;
}

export async function getVoucherStats(): Promise<{ stats: VoucherStats; data?: VoucherStats; error: string | null }> {
  try {
    const response = await fetch('/api/admin/vouchers/stats');
    const stats = await response.json();
    return { stats, data: stats, error: null };
  } catch (error) {
    console.error('Failed to fetch voucher stats:', error);
    const defaultStats = { totalVouchers: 0, activeVouchers: 0, totalRedemptions: 0, totalDiscount: 0 };
    return { stats: defaultStats, data: defaultStats, error: 'Failed to fetch voucher stats' };
  }
}
