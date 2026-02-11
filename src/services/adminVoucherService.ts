/**
 * Admin Voucher Service
 * 管理员优惠券管理功能
 */

import { getApiErrorMessage } from '@/services/apiClient';
import { cachedRequest, invalidateRequestCacheByPrefix } from '@/services/requestCache';

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
  isAutoIssue?: boolean;
  is_auto_issue?: boolean;
  isFirstOrderOnly?: boolean;
  is_first_order_only?: boolean;
  validityDays?: number | null;
  validity_days?: number | null;
  // 每用户兑换上限
  maxRedemptionsPerUser?: number;
  max_redemptions_per_user?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return undefined;
}

export function normalizeVoucher(raw: unknown): Voucher {
  // Normalize API voucher payload to expose both camelCase and snake_case fields for UI compatibility
  const source = isRecord(raw) ? raw : {};
  const validFrom = source.validFrom ?? source.valid_from;
  const validUntil = source.validUntil ?? source.valid_until;
  const minPurchaseValue = source.minPurchase ?? source.min_purchase ?? 0;
  const pointsCostValue = source.pointsCost ?? source.points_cost ?? 0;
  const maxUsesValue = source.maxUses ?? source.usage_limit ?? null;
  const isAutoIssue = toBoolean(source.isAutoIssue ?? source.is_auto_issue, false);
  const isFirstOrderOnly = toBoolean(source.isFirstOrderOnly ?? source.is_first_order_only, false);
  const validityDays = toNullableNumber(source.validityDays ?? source.validity_days);
  const rawCode = typeof source.code === 'string' ? source.code : '';
  const createdAt = toDate(source.createdAt ?? source.created_at);
  const updatedAt = toDate(source.updatedAt ?? source.updated_at);
  const maxRedemptionsPerUser = toNumber(
    source.maxRedemptionsPerUser ?? source.max_redemptions_per_user ?? 1,
    1
  );

  const validFromValue =
    validFrom instanceof Date || typeof validFrom === 'string' ? validFrom : undefined;
  const validUntilValue =
    validUntil instanceof Date || typeof validUntil === 'string' ? validUntil : undefined;

  return {
    ...source,
    id: typeof source.id === 'string' ? source.id : '',
    code: rawCode.toUpperCase(),
    name: typeof source.name === 'string' ? source.name : '',
    type: typeof source.type === 'string' ? source.type : 'fixed_amount',
    value: toNumber(source.value, 0),
    minPurchase: Number(minPurchaseValue ?? 0),
    min_purchase: Number(minPurchaseValue ?? 0),
    maxUses: toOptionalNumber(maxUsesValue),
    usage_limit: toOptionalNumber(maxUsesValue),
    pointsCost: Number(pointsCostValue ?? 0),
    points_cost: Number(pointsCostValue ?? 0),
    validFrom: validFromValue,
    valid_from: validFromValue,
    validUntil: validUntilValue,
    valid_until: validUntilValue,
    active: toBoolean(source.active ?? source.isActive ?? source.is_active, true),
    maxRedemptionsPerUser,
    max_redemptions_per_user: maxRedemptionsPerUser,
    isAutoIssue,
    is_auto_issue: isAutoIssue,
    isFirstOrderOnly,
    is_first_order_only: isFirstOrderOnly,
    validityDays,
    validity_days: validityDays,
    // 时间字段双向映射
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
  };
}

export interface GetVouchersFilter {
  status?: VoucherStatus;
  type?: VoucherType;
  searchTerm?: string;
}

export async function getAllVouchers(filters?: GetVouchersFilter): Promise<{ vouchers: Voucher[]; data?: Voucher[]; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.searchTerm) params.append('search', filters.searchTerm);

  const queryString = params.toString();
  const url = queryString ? `/api/admin/vouchers?${queryString}` : '/api/admin/vouchers';
  const cacheKey = `admin:vouchers:list:${queryString || 'all'}`;

  return cachedRequest(cacheKey, async () => {
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.ok === false || result?.success === false) {
        return { vouchers: [], data: [], error: getApiErrorMessage(result, 'Failed to fetch vouchers') };
      }
      const vouchers = Array.isArray(result?.data)
        ? (result.data as unknown[]).map((item) => normalizeVoucher(item))
        : [];
      return { vouchers, data: vouchers, error: null };
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
      return { vouchers: [], data: [], error: 'Failed to fetch vouchers' };
    }
  }, { ttlMs: 20000 });
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
    invalidateRequestCacheByPrefix('admin:vouchers');
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
    invalidateRequestCacheByPrefix('admin:vouchers');
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
    invalidateRequestCacheByPrefix('admin:vouchers');
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
    invalidateRequestCacheByPrefix('admin:vouchers');
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
    invalidateRequestCacheByPrefix('admin:vouchers');
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
  const cacheKey = 'admin:vouchers:stats';

  return cachedRequest(cacheKey, async () => {
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
  }, { ttlMs: 20000 });
}
