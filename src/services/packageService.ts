/**
 * Package Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { Package, UserPackage } from '.prisma/client';
import {
  buyPackageAction,
  getAvailablePackagesAction,
  getFeaturedPackagesAction,
  getPackageUsageAction,
  getUserPackagesAction,
  getUserPackagesForProfileAction,
} from '@/actions/packages.actions';

// Re-export types for convenience
export type { Package, UserPackage } from '.prisma/client';

export interface UserPackageWithPackage extends Omit<UserPackage, 'userId' | 'packageId' | 'originalTimes' | 'expiry' | 'createdAt' | 'updatedAt'> {
  package: Package;
  // Re-declare fields with correct types
  userId: string;
  packageId: string;
  originalTimes: number;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
  // snake_case aliases for backward compatibility
  expires_at?: Date | string | null;
  expiresAt?: Date | string | null;
  user_id?: string;
  package_id?: string;
  original_times?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * 获取所有可用套餐
 */
export async function getAvailablePackages(): Promise<{ data?: Package[]; error?: any }> {
  try {
    const data = await getAvailablePackagesAction();
    return { data };
  } catch (error: any) {
    return { error };
  }
}

/**
 * 获取用户已购买套餐
 */
export async function getUserPackages(
  status?: 'active' | 'expired' | 'used_up' | boolean
): Promise<{ data?: UserPackageWithPackage[]; error?: any }> {
  try {
    const data = await getUserPackagesAction(typeof status === 'string' ? status : undefined);
    return { data: data as UserPackageWithPackage[] };
  } catch (error: any) {
    return { error };
  }
}

/**
 * 获取用户套餐摘要
 */
export async function getUserPackageSummary(): Promise<{ summary?: { totalRemaining: number; packages: any[] }; error?: string }> {
  const { data: packages, error } = await getUserPackages('active');
  
  if (error) {
    return { error: error.message || '获取套餐摘要失败' };
  }

  const totalRemaining = (packages || []).reduce((sum, pkg) => sum + (pkg.remaining || 0), 0);
  return { summary: { totalRemaining, packages: packages || [] } };
}

/**
 * 购买套餐
 */
export async function buyPackage(packageId: string, paymentMethod: string): Promise<any> {
  return buyPackageAction({ packageId, paymentMethod });
}

/**
 * 获取精选套餐
 */
export async function getFeaturedPackages(limit?: number): Promise<Package[]> {
  return getFeaturedPackagesAction(limit || 3);
}

/**
 * 获取用户套餐（Profile UI 结构）
 */
export async function getUserPackagesForProfile(): Promise<{ packages?: any[]; error?: string }> {
  try {
    const packages = await getUserPackagesForProfileAction();
    return { packages };
  } catch (error: any) {
    return { packages: [], error: error.message || '获取套餐失败' };
  }
}

/**
 * 获取套餐使用记录（Profile UI 结构）
 */
export async function getPackageUsage(packageId: string): Promise<{ usage?: any[]; error?: string }> {
  try {
    const usage = await getPackageUsageAction(packageId);
    return { usage };
  } catch (error: any) {
    return { usage: [], error: error.message || '获取使用记录失败' };
  }
}

/**
 * 获取可用套餐（用于下单时选择）
 */
export async function getActiveUserPackages(): Promise<UserPackageWithPackage[]> {
  const result = await getUserPackages('active');
  return result.data || [];
}

/**
 * 获取套餐详情
 */
export async function getPackageById(packageId: string): Promise<{ package: Package | null; error: string | null }> {
  try {
    const result = await getAvailablePackages();
    const packages = result.data || [];
    const pkg = packages.find((p: Package) => p.id === packageId);

    if (!pkg) {
      return { package: null, error: '套餐不存在' };
    }

    return { package: pkg, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch package';
    return { package: null, error: errorMessage };
  }
}

/**
 * 检查用户是否有可用套餐
 */
export async function hasAvailablePackage(): Promise<boolean> {
  try {
    const activePackages = await getActiveUserPackages();
    return activePackages.length > 0;
  } catch (error) {
    console.error('Failed to check available packages:', error);
    return false;
  }
}

/**
 * 获取用户优先级最高的可用套餐（即将到期或剩余次数最少）
 */
export async function getPriorityPackage(): Promise<UserPackageWithPackage | null> {
  try {
    const activePackages = await getActiveUserPackages();
    if (activePackages.length === 0) return null;
    
    // 按剩余次数升序排序（优先使用次数少的），若次数相同则按到期日期升序
    const sorted = activePackages.sort((a, b) => {
      const remainingA = (a as any).remaining_uses ?? (a as any).remainingUses ?? 999;
      const remainingB = (b as any).remaining_uses ?? (b as any).remainingUses ?? 999;
      if (remainingA !== remainingB) return remainingA - remainingB;
      
      const expiryA = new Date((a as any).expires_at || (a as any).expiresAt || 0).getTime();
      const expiryB = new Date((b as any).expires_at || (b as any).expiresAt || 0).getTime();
      return expiryA - expiryB;
    });
    
    return sorted[0];
  } catch (error) {
    console.error('Failed to get priority package:', error);
    return null;
  }
}

/**
 * 购买套餐（别名）
 */
export async function purchasePackage(
  packageId: string,
  paymentMethod: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await buyPackage(packageId, paymentMethod);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || '购买套餐失败' };
  }
}
