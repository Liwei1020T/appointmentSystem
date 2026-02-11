/**
 * Package Service - API client
 * Wraps package-related API routes for client usage.
 */

import type { Package, UserPackage } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';

export type { Package, UserPackage } from '.prisma/client';

interface ServiceResult<T> {
  data?: T;
  error?: Error;
}

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
  expiry_date?: Date | string | null;
  remaining_uses?: number;
  remainingUses?: number;
}

export interface PackagePurchaseResult {
  paymentId: string;
  packageId: string;
  packageName: string;
  amount: number;
  originalAmount?: number;
  renewalDiscount?: number;
  times: number;
  validityDays: number;
  paymentRequired: boolean;
  paymentMethod: 'cash' | 'tng';
}

export interface PendingPackagePayment {
  id: string;
  packageId: string | null;
  packageName: string;
  packageTimes: number;
  packageValidityDays: number;
  amount: number;
  status: 'pending' | 'pending_verification';
  provider: 'cash' | 'tng';
  receiptUrl?: string;
  createdAt: string;
}

export interface ProfilePackagePayload {
  id: string;
  name: string;
  total_uses: number;
  price: number;
  validity_days: number | null;
}

export interface ProfileUserPackagePayload {
  id: string;
  package_id: string;
  remaining_uses: number;
  expiry_date: string | Date;
  created_at: string | Date;
  package: ProfilePackagePayload;
}

export interface PackageUsageRecord {
  id: string;
  used_at: string;
  order: {
    order_number: string;
    string: {
      brand: string;
      model: string;
    };
  };
}

export interface PackageSummaryData {
  totalRemaining: number;
  packages: UserPackageWithPackage[];
}

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error(fallbackMessage);
}

function getRemainingUses(pkg: UserPackageWithPackage): number {
  const value = pkg.remaining_uses ?? pkg.remainingUses ?? pkg.remaining;
  return Number.isFinite(Number(value)) ? Number(value) : 999;
}

function toTimestamp(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getExpiryTimestamp(pkg: UserPackageWithPackage): number {
  return toTimestamp(pkg.expires_at ?? pkg.expiresAt ?? pkg.expiry);
}

export function sortPackagesByPriority(packages: UserPackageWithPackage[]): UserPackageWithPackage[] {
  return [...packages].sort((a, b) => {
    const remainingA = getRemainingUses(a);
    const remainingB = getRemainingUses(b);
    if (remainingA !== remainingB) return remainingA - remainingB;

    const expiryA = getExpiryTimestamp(a);
    const expiryB = getExpiryTimestamp(b);
    return expiryA - expiryB;
  });
}

/**
 * Fetch all available packages.
 */
export async function getAvailablePackages(): Promise<ServiceResult<Package[]>> {
  try {
    const data = await apiRequest<Package[]>('/api/packages');
    return { data };
  } catch (error: unknown) {
    return { error: toError(error, 'Failed to fetch packages') };
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
): Promise<ServiceResult<UserPackageWithPackage[]>> {
  try {
    const query = typeof status === 'string' ? `?status=${status}` : '';
    const data = await apiRequest<UserPackageWithPackage[]>(`/api/packages/user${query}`);
    return { data };
  } catch (error: unknown) {
    return { error: toError(error, 'Failed to fetch user packages') };
  }
}

/**
 * Fetch a summary of active user packages.
 */
export async function getUserPackageSummary(): Promise<{ summary?: PackageSummaryData; error?: string }> {
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
export async function buyPackage(packageId: string, paymentMethod: string): Promise<PackagePurchaseResult> {
  return apiRequest<PackagePurchaseResult>('/api/packages/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId, paymentMethod }),
  });
}

/**
 * Fetch pending package payments for the current user.
 */
export async function getPendingPackagePayments(): Promise<PendingPackagePayment[]> {
  return apiRequest<PendingPackagePayment[]>('/api/packages/pending-payments');
}

/**
 * Map user packages to profile-friendly shape.
 */
export async function getUserPackagesForProfile(): Promise<{ packages?: ProfileUserPackagePayload[]; error?: string }> {
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
  } catch (error: unknown) {
    return { packages: [], error: toError(error, 'Failed to fetch packages').message };
  }
}

/**
 * Fetch usage records for a specific user package.
 */
export async function getPackageUsage(packageId: string): Promise<{ usage?: PackageUsageRecord[]; error?: string }> {
  try {
    const usage = await apiRequest<PackageUsageRecord[]>(`/api/packages/user/${packageId}/usage`);
    return { usage };
  } catch (error: unknown) {
    return { usage: [], error: toError(error, 'Failed to fetch usage').message };
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
 * Check whether the user has active packages available.
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

    const sorted = sortPackagesByPriority(activePackages);

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
  } catch (error: unknown) {
    return { success: false, error: toError(error, 'Failed to purchase package').message };
  }
}
