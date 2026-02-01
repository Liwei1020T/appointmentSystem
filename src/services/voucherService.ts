/**
 * Voucher Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { UserVoucher, Voucher } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';

export interface UserVoucherWithVoucher extends UserVoucher {
  voucher: Voucher;
}

export interface RedeemableVoucher {
  id: string;
  code: string;
  name?: string | null;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_purchase?: number;
  max_discount?: number | null;
  points_cost?: number;
  points_required?: number;
  valid_from?: string;
  valid_until?: string;
  active?: boolean;
  owned_count: number;
  max_per_user: number;
  can_redeem: boolean;
  remaining_redemptions: number;
  max_redemptions_per_user?: number;
  type?: string;
  value?: number;
  minPurchase?: number;
  pointsCost?: number;
}

// 用于兼容多种命名格式的优惠券对象
export interface VoucherLike {
  id?: string;
  code?: string;
  discount_type?: string | null;
  discountType?: string | null;
  type?: string | null;
  discount_value?: number | { toNumber(): number } | null;
  discountValue?: number | { toNumber(): number } | null;
  value?: number | { toNumber(): number } | null;
  min_purchase?: number | { toNumber(): number } | null;
  minPurchase?: number | { toNumber(): number } | null;
  max_discount?: number | { toNumber(): number } | null;
  maxDiscount?: number | { toNumber(): number } | null;
  valid_until?: string | Date | null;
  validUntil?: string | Date | null;
  expiry?: string | Date | null;
  expires_at?: string | null;
  status?: string | null;
  used_at?: string | Date | null;
  usedAt?: string | Date | null;
  voucher?: VoucherLike;
}

export interface ProfileVoucher {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  status: string;
  expiry: string | null;
}

export interface RedeemResult {
  success: boolean;
  userVoucher?: UserVoucherWithVoucher;
  message?: string;
}

/**
 * 获取用户优惠券
 */
export async function getUserVouchers(
  status?: 'active' | 'used' | 'expired'
): Promise<{ vouchers?: UserVoucherWithVoucher[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const payload = await apiRequest<{ vouchers: UserVoucherWithVoucher[] }>(
      `/api/vouchers/user?${params.toString()}`
    );
    return { vouchers: payload?.vouchers || [] };
  } catch (error) {
    console.error('Error getting user vouchers:', error);
    return { error: '获取优惠券失败' };
  }
}

/**
 * 获取用户优惠券（UI 显示用）
 */
export async function getUserVouchersForProfile(
  status?: 'active' | 'used' | 'expired'
): Promise<{ vouchers?: ProfileVoucher[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set('mapped', 'true');
    if (status) params.set('status', status);
    const payload = await apiRequest<{ vouchers: ProfileVoucher[] }>(`/api/vouchers/user?${params.toString()}`);
    return { vouchers: payload?.vouchers || [] };
  } catch (error) {
    console.error('Error getting user vouchers for profile:', error);
    return { error: '获取优惠券失败' };
  }
}

/**
 * 兑换优惠券
 */
export async function redeemVoucher(
  code: string,
  usePoints = false
): Promise<RedeemResult> {
  return apiRequest<RedeemResult>(`/api/vouchers/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, usePoints }),
  });
}

/**
 * 获取可用优惠券（用于下单时选择）
 */
export async function getActiveVouchers(): Promise<UserVoucherWithVoucher[]> {
  const result = await getUserVouchers('active');
  return result.vouchers || [];
}

/**
 * 验证优惠券是否可用（根据code）
 */
export async function validateVoucher(code: string): Promise<boolean> {
  try {
    const result = await getUserVouchers('active');
    const vouchers = result.vouchers || [];
    return vouchers.some(
      (v) => v.voucher.code.toUpperCase() === code.toUpperCase()
    );
  } catch (error) {
    return false;
  }
}

/**
 * 验证优惠券是否可用于订单（根据对象和金额）
 */
export function validateVoucherForOrder(voucher: VoucherLike | null, orderAmount: number): { valid: boolean; error?: string } {
  if (!voucher) return { valid: false, error: '无效的优惠券' };

  // 获取实际的 voucher 对象（可能嵌套在 UserVoucher 中）
  const actualVoucher = voucher.voucher || voucher;

  // 检查最低消费，处理 Decimal 类型
  const minPurchaseRaw = actualVoucher.min_purchase || actualVoucher.minPurchase || 0;
  const minPurchase = typeof minPurchaseRaw === 'object' && minPurchaseRaw !== null && 'toNumber' in minPurchaseRaw
    ? minPurchaseRaw.toNumber()
    : Number(minPurchaseRaw) || 0;

  if (orderAmount < minPurchase) {
    return { valid: false, error: `最低消费 RM${minPurchase}` };
  }

  // 检查是否过期
  const expiry = voucher.expiry || voucher.expires_at || actualVoucher.validUntil || actualVoucher.valid_until;
  if (expiry) {
    const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);
    if (expiryDate < new Date()) {
      return { valid: false, error: '已过期' };
    }
  }

  // 检查是否已使用
  if (voucher.status === 'used' || voucher.used_at || voucher.usedAt) {
    return { valid: false, error: '已使用' };
  }

  return { valid: true };
}

/**
 * 获取可兑换的优惠券（使用积分兑换）
 */
export async function getRedeemableVouchers(): Promise<{ vouchers: RedeemableVoucher[]; error: string | null }> {
  try {
    const payload = await apiRequest<{ vouchers: RedeemableVoucher[] }>(`/api/vouchers/redeemable`);
    return { vouchers: Array.isArray(payload?.vouchers) ? payload.vouchers : [], error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取可兑换优惠券失败';
    return { vouchers: [], error: message };
  }
}

/**
 * 使用积分兑换优惠券
 */
export async function redeemVoucherWithPoints(
  voucherId: string,
  points?: number
): Promise<{ success: boolean; userVoucher?: UserVoucherWithVoucher; error: string | null }> {
  try {
    const result = await apiRequest<{ userVoucher: UserVoucherWithVoucher }>(`/api/vouchers/redeem-with-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId, points }),
    });
    return { success: true, userVoucher: result.userVoucher, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '兑换失败';
    return { success: false, error: message };
  }
}

/**
 * 计算优惠券折扣金额
 * 支持传入 Voucher 或 UserVoucher
 */
export function calculateDiscount(voucher: VoucherLike | Voucher | UserVoucher | null, orderAmount: number): number {
  if (!voucher) return 0;

  // 如果是 UserVoucher，获取嵌套的 voucher 对象
  const actualVoucher = (voucher as VoucherLike).voucher || voucher;

  // 获取折扣类型和值（支持多种命名格式）
  const v = actualVoucher as VoucherLike;
  const discountType = v.discount_type || v.discountType || v.type;
  const discountValueRaw = v.discount_value || v.discountValue || v.value;
  const maxDiscountRaw = v.max_discount || v.maxDiscount;
  const minPurchaseRaw = v.min_purchase || v.minPurchase || 0;

  // 检查最低消费，处理 Decimal 类型
  const minPurchase = typeof minPurchaseRaw === 'object' && minPurchaseRaw !== null && 'toNumber' in minPurchaseRaw
    ? minPurchaseRaw.toNumber()
    : Number(minPurchaseRaw) || 0;

  if (orderAmount < minPurchase) return 0;

  // 转换 Decimal 类型
  const discountValue = typeof discountValueRaw === 'object' && discountValueRaw !== null && 'toNumber' in discountValueRaw
    ? discountValueRaw.toNumber()
    : (discountValueRaw as number) || 0;
  const maxDiscount = typeof maxDiscountRaw === 'object' && maxDiscountRaw !== null && 'toNumber' in maxDiscountRaw
    ? maxDiscountRaw.toNumber()
    : (maxDiscountRaw as number | null);

  // 计算折扣
  if (discountType === 'PERCENTAGE' || discountType === 'percentage' || discountType === 'percentage_off') {
    const discount = (orderAmount * discountValue) / 100;
    return maxDiscount ? Math.min(discount, maxDiscount) : discount;
  } else if (discountType === 'FIXED' || discountType === 'fixed' || discountType === 'fixed_amount') {
    return Math.min(discountValue, orderAmount);
  }
  return 0;
}

/**
 * 获取所有可用优惠券
 */
export async function getAvailableVouchers(): Promise<{ vouchers: RedeemableVoucher[]; error: string | null }> {
  try {
    const payload = await apiRequest<{ vouchers: RedeemableVoucher[] }>(`/api/vouchers/redeemable`);
    return { vouchers: payload?.vouchers || [], error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取可用优惠券失败';
    return { vouchers: [], error: message };
  }
}

/**
 * 优惠券统计信息
 */
export interface VoucherStats {
  totalVouchers: number;
  usedVouchers: number;
  expiredVouchers: number;
  activeVouchers: number;
  totalSavings: number;
}

/**
 * 获取用户优惠券统计
 */
export async function getVoucherStats(): Promise<VoucherStats> {
  try {
    const payload = await apiRequest<VoucherStats>(`/api/vouchers/stats`);
    if (!payload) {
      return {
        totalVouchers: 0,
        usedVouchers: 0,
        expiredVouchers: 0,
        activeVouchers: 0,
        totalSavings: 0,
      };
    }
    return {
      totalVouchers: payload.totalVouchers || 0,
      usedVouchers: payload.usedVouchers || 0,
      expiredVouchers: payload.expiredVouchers || 0,
      activeVouchers: payload.activeVouchers || 0,
      totalSavings: payload.totalSavings || 0,
    };
  } catch (error) {
    console.error('Error fetching voucher stats:', error);
    return {
      totalVouchers: 0,
      usedVouchers: 0,
      expiredVouchers: 0,
      activeVouchers: 0,
      totalSavings: 0,
    };
  }
}
