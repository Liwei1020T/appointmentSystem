/**
 * Admin Voucher Service
 * 管理员优惠券管理功能
 */

import { getApiErrorMessage } from '@/services/apiClient';

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
  name: string;
  type: VoucherType;
  value: number;
  minPurchase: number;
  min_purchase?: number;
  maxUses?: number | null;
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
  // 每用户兑换上限
  maxRedemptionsPerUser?: number;
  max_redemptions_per_user?: number;
}

function normalizeVoucher(raw: any): Voucher {
  // Normalize API voucher payload to expose both camelCase and snake_case fields for UI compatibility
  if (!raw) return raw;
  const validFrom = raw.validFrom || raw.valid_from;
  const validUntil = raw.validUntil || raw.valid_until;
  const minPurchaseValue = raw.minPurchase ?? raw.min_purchase ?? 0;
  const pointsCostValue = raw.pointsCost ?? raw.points_cost ?? 0;
  const maxUsesValue = raw.maxUses ?? raw.usage_limit ?? null;

  return {
    ...raw,
    id: raw.id,
    code: raw.code?.toUpperCase?.() || raw.code,
    name: raw.name,
    type: raw.type,
    value: Number(raw.value ?? 0),
    minPurchase: Number(minPurchaseValue ?? 0),
    min_purchase: Number(minPurchaseValue ?? 0),
    maxUses: maxUsesValue,
    usage_limit: maxUsesValue,
    pointsCost: Number(pointsCostValue ?? 0),
    points_cost: Number(pointsCostValue ?? 0),
    validFrom,
    valid_from: validFrom,
    validUntil,
    valid_until: validUntil,
    active: raw.active ?? raw.isActive ?? raw.is_active,
    maxRedemptionsPerUser: raw.maxRedemptionsPerUser ?? raw.max_redemptions_per_user ?? 1,
    max_redemptions_per_user: raw.maxRedemptionsPerUser ?? raw.max_redemptions_per_user ?? 1,
    // 时间字段双向映射
    createdAt: raw.createdAt || raw.created_at,
    created_at: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
    updated_at: raw.updatedAt || raw.updated_at,
  };
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
    const result = await response.json();
    if (!response.ok || result?.ok === false || result?.success === false) {
      return { vouchers: [], data: [], error: getApiErrorMessage(result, 'Failed to fetch vouchers') };
    }
    const vouchers = Array.isArray(result?.data)
      ? (result.data as any[]).map(normalizeVoucher)
      : [];
    return { vouchers, data: vouchers, error: null };
  } catch (error) {
    console.error('Failed to fetch vouchers:', error);
    return { vouchers: [], data: [], error: 'Failed to fetch vouchers' };
  }
}

export async function getVoucherById(voucherId: string): Promise<{ voucher: Voucher | null; data?: Voucher | null; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers?id=${voucherId}`);
    const result = await response.json();
    if (!response.ok || result?.ok === false || result?.success === false) {
      return { voucher: null, data: null, error: getApiErrorMessage(result, 'Voucher not found') };
    }
    const voucherData = normalizeVoucher(result?.data);
    return { voucher: voucherData, data: voucherData, error: null };
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
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok === false || result?.success === false) {
      return {
        voucher: null,
        success: false,
        error: getApiErrorMessage(result, 'Failed to create voucher'),
      };
    }

    const voucher = normalizeVoucher(result?.data) || null;
    return { voucher, success: true, error: null };
  } catch (error) {
    console.error('Failed to create voucher:', error);
    return { voucher: null, success: false, error: (error as Error)?.message || 'Failed to create voucher' };
  }
}

export async function updateVoucher(
  voucherId: string,
  data: Partial<Voucher>
): Promise<{ voucher: Voucher | null; success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/vouchers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: voucherId, ...data }),
    });
    const result = await response.json();
    if (!response.ok || result?.ok === false || result?.success === false) {
      return { voucher: null, success: false, error: getApiErrorMessage(result, 'Failed to update voucher') };
    }
    const voucher = normalizeVoucher(result?.data) || null;
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

    const raw = await response.json().catch(() => ({}));
    if (!response.ok || raw?.ok === false || raw?.success === false) {
      return { success: false, error: getApiErrorMessage(raw, 'Failed to distribute voucher') };
    }
    const payload = raw?.data ?? raw;
    return { success: true, count: payload.count || payload.distributed || 0, error: null };
  } catch (error) {
    console.error('Failed to distribute voucher:', error);
    return { success: false, error: 'Failed to distribute voucher' };
  }
}

export async function deleteVoucher(voucherId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/vouchers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: voucherId }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return { success: false, error: getApiErrorMessage(result, 'Failed to delete voucher') };
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

export async function getUserVouchers(voucherId: string): Promise<{ data: UserVoucher[]; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/vouchers/${voucherId}/users`);
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { data: [], error: getApiErrorMessage(raw, 'Failed to fetch user vouchers') };
    }
    const payload = raw?.data ?? raw;
    return { data: payload.vouchers || payload.data || payload || [], error: null };
  } catch (error) {
    console.error('Failed to fetch user vouchers:', error);
    return { data: [], error: 'Failed to fetch user vouchers' };
  }
}

export async function toggleVoucherStatus(voucherId: string, active?: boolean): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/vouchers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: voucherId, active }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok === false || result?.success === false) {
      return { success: false, error: getApiErrorMessage(result, 'Failed to toggle voucher status') };
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
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fallback = { totalVouchers: 0, activeVouchers: 0, totalRedemptions: 0, totalDiscount: 0 };
      return { stats: fallback, data: fallback, error: getApiErrorMessage(raw, 'Failed to fetch voucher stats') };
    }
    const payload = raw?.data ?? raw;
    return { stats: payload, data: payload, error: null };
  } catch (error) {
    console.error('Failed to fetch voucher stats:', error);
    const defaultStats = { totalVouchers: 0, activeVouchers: 0, totalRedemptions: 0, totalDiscount: 0 };
    return { stats: defaultStats, data: defaultStats, error: 'Failed to fetch voucher stats' };
  }
}
