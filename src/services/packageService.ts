/**
 * Package Service - API client
 * Wraps package-related API routes for client usage.
 */

import type { Package, UserPackage } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';

export type { Package, UserPackage } from '.prisma/client';

export interface UserPackageWithPackage
  extends Omit<UserPackage, 'userId' | 'packageId' | 'originalTimes' | 'expiry' | 'createdAt' | 'updatedAt'> {
  package: Package;
  userId: string;
  packageId: string;
  originalTimes: number;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
  expires_at?: Date | string | null;
  expiresAt?: Date | string | null;
  user_id?: string;
  package_id?: string;
  original_times?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Fetch all available packages.
 */
export async function getAvailablePackages(): Promise<{ data?: Package[]; error?: any }> {
  try {
    const data = await apiRequest<Package[]>('/api/packages');
    return { data };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Fetch featured packages.
 */
export async function getFeaturedPackages(limit?: number): Promise<Package[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest<Package[]>(`/api/packages/featured${query}`);
}

/**
 * Fetch user packages with optional status filter.
 */
export async function getUserPackages(
  status?: 'active' | 'expired' | 'used_up' | boolean
): Promise<{ data?: UserPackageWithPackage[]; error?: any }> {
  try {
    const query = typeof status === 'string' ? `?status=${status}` : '';
    const data = await apiRequest<UserPackageWithPackage[]>(`/api/packages/user${query}`);
    return { data };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Fetch a summary of active user packages.
 */
export async function getUserPackageSummary(): Promise<{ summary?: { totalRemaining: number; packages: any[] }; error?: string }> {
  const { data: packages, error } = await getUserPackages('active');

  if (error) {
    return { error: error.message || 'Failed to fetch package summary' };
  }

  const totalRemaining = (packages || []).reduce((sum, pkg) => sum + (pkg.remaining || 0), 0);
  return { summary: { totalRemaining, packages: packages || [] } };
}

/**
 * Create a package purchase payment.
 */
export async function buyPackage(packageId: string, paymentMethod: string): Promise<any> {
  return apiRequest('/api/packages/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId, paymentMethod }),
  });
}

/**
 * Fetch pending package payments for the current user.
 */
export async function getPendingPackagePayments(): Promise<any[]> {
  return apiRequest<any[]>('/api/packages/pending-payments');
}

/**
 * Map user packages to profile-friendly shape.
 */
export async function getUserPackagesForProfile(): Promise<{ packages?: any[]; error?: string }> {
  try {
    const { data } = await getUserPackages();
    const packages = (data || []).map((pkg) => ({
      id: pkg.id,
      package_id: pkg.packageId,
      remaining_uses: pkg.remaining,
      expiry_date: pkg.expiry?.toISOString?.() ?? pkg.expiry,
      created_at: pkg.createdAt?.toISOString?.() ?? pkg.createdAt,
      package: {
        id: pkg.package.id,
        name: pkg.package.name,
        total_uses: pkg.package.times,
        price: Number(pkg.package.price),
        validity_days: pkg.package.validityDays,
      },
    }));
    return { packages };
  } catch (error: any) {
    return { packages: [], error: error.message || 'Failed to fetch packages' };
  }
}

/**
 * Fetch usage records for a specific user package.
 */
export async function getPackageUsage(packageId: string): Promise<{ usage?: any[]; error?: string }> {
  try {
    const usage = await apiRequest<any[]>(`/api/packages/user/${packageId}/usage`);
    return { usage };
  } catch (error: any) {
    return { usage: [], error: error.message || 'Failed to fetch usage' };
  }
}

/**
 * Fetch active packages for order checkout usage.
 */
export async function getActiveUserPackages(): Promise<UserPackageWithPackage[]> {
  const result = await getUserPackages('active');
  return result.data || [];
}

/**
 * Find a package by id from available packages.
 */
export async function getPackageById(packageId: string): Promise<{ package: Package | null; error: string | null }> {
  try {
    const result = await getAvailablePackages();
    const packages = result.data || [];
    const pkg = packages.find((p: Package) => p.id === packageId);

    if (!pkg) {
      return { package: null, error: 'Package not found' };
    }

    return { package: pkg, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch package';
    return { package: null, error: errorMessage };
  }
}

/**
 * Check whether the user has any active packages.
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
 * Fetch the highest priority package (soonest expiry or lowest remaining).
 */
export async function getPriorityPackage(): Promise<UserPackageWithPackage | null> {
  try {
    const activePackages = await getActiveUserPackages();
    if (activePackages.length === 0) return null;

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
 * Purchase package helper with standard result shape.
 */
export async function purchasePackage(
  packageId: string,
  paymentMethod: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await buyPackage(packageId, paymentMethod);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to purchase package' };
  }
}
