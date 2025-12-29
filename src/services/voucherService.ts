/**
 * Voucher Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { UserVoucher, Voucher } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';

export interface UserVoucherWithVoucher extends UserVoucher {
  voucher: Voucher;
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
): Promise<{ vouchers?: any[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set('mapped', 'true');
    if (status) params.set('status', status);
    const payload = await apiRequest<{ vouchers: any[] }>(`/api/vouchers/user?${params.toString()}`);
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
): Promise<any> {
  return apiRequest(`/api/vouchers/redeem`, {
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
export function validateVoucherForOrder(voucher: any, orderAmount: number): { valid: boolean; error?: string } {
  if (!voucher) return { valid: false, error: '无效的优惠券' };
  
  // 获取实际的 voucher 对象（可能嵌套在 UserVoucher 中）
  const actualVoucher = voucher.voucher || voucher;
  
  // 检查最低消费
  const minPurchase = actualVoucher.min_purchase || actualVoucher.minPurchase || 0;
  if (orderAmount < minPurchase) {
    return { valid: false, error: `最低消费 RM${minPurchase}` };
  }
  
  // 检查是否过期
  const expiry = voucher.expiry || voucher.expires_at || actualVoucher.validUntil || actualVoucher.valid_until;
  if (expiry) {
    const expiryDate = new Date(expiry);
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
export async function getRedeemableVouchers(): Promise<{ vouchers: Voucher[]; error: string | null }> {
  try {
    const payload = await apiRequest<{ vouchers: Voucher[] }>(`/api/vouchers/redeemable`);
    return { vouchers: Array.isArray(payload?.vouchers) ? payload.vouchers : [], error: null };
  } catch (error: any) {
    return { vouchers: [], error: error.message || '获取可兑换优惠券失败' };
  }
}

/**
 * 使用积分兑换优惠券
 */
export async function redeemVoucherWithPoints(
  voucherId: string,
  points?: number
): Promise<{ success: boolean; userVoucher?: any; error: string | null }> {
  try {
    const result = await apiRequest<{ userVoucher: any }>(`/api/vouchers/redeem-with-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId, points }),
    });
    return { success: true, userVoucher: result.userVoucher, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || '兑换失败' };
  }
}

/**
 * 计算优惠券折扣金额
 * 支持传入 Voucher 或 UserVoucher
 */
export function calculateDiscount(voucher: Voucher | UserVoucher | any, orderAmount: number): number {
  if (!voucher) return 0;
  
  // 如果是 UserVoucher，获取嵌套的 voucher 对象
  const actualVoucher = (voucher as any).voucher || voucher;
  
  // 获取折扣类型和值（支持多种命名格式）
  const discountType = actualVoucher.discount_type || actualVoucher.discountType || actualVoucher.type;
  const discountValue = actualVoucher.discount_value || actualVoucher.discountValue || actualVoucher.value;
  const maxDiscount = actualVoucher.max_discount || actualVoucher.maxDiscount;
  const minPurchase = actualVoucher.min_purchase || actualVoucher.minPurchase || 0;
  
  // 检查最低消费
  if (orderAmount < minPurchase) return 0;
  
  // 计算折扣
  if (discountType === 'PERCENTAGE' || discountType === 'percentage' || discountType === 'percentage_off') {
    let discount = (orderAmount * (typeof discountValue === 'object' ? discountValue.toNumber() : discountValue)) / 100;
    const maxDiscountValue = typeof maxDiscount === 'object' ? maxDiscount.toNumber() : maxDiscount;
    return maxDiscountValue ? Math.min(discount, maxDiscountValue) : discount;
  } else if (discountType === 'FIXED' || discountType === 'fixed' || discountType === 'fixed_amount') {
    const value = typeof discountValue === 'object' ? discountValue.toNumber() : discountValue;
    return Math.min(value, orderAmount);
  }
  return 0;
}

/**
 * 获取所有可用优惠券
 */
export async function getAvailableVouchers(): Promise<{ vouchers: Voucher[]; error: string | null }> {
  try {
    const payload = await apiRequest<{ vouchers: Voucher[] }>(`/api/vouchers/redeemable`);
    return { vouchers: payload?.vouchers || [], error: null };
  } catch (error: any) {
    return { vouchers: [], error: error.message || '获取可用优惠券失败' };
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
    const payload = await apiRequest<any>(`/api/vouchers/stats`);
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
      totalVouchers: payload.totalVouchers || payload.total || 0,
      usedVouchers: payload.usedVouchers || payload.used || 0,
      expiredVouchers: payload.expiredVouchers || payload.expired || 0,
      activeVouchers: payload.activeVouchers || payload.active || 0,
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
