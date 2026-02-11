/**
 * Admin Package Service
 * Re-export from package.service.ts for backward compatibility
 */

import { apiRequest } from '@/services/apiClient';
import { cachedRequest, invalidateRequestCacheByPrefix } from '@/services/requestCache';

export * from './packageService';

type DateLike = Date | string;

export type PackageStatus = 'all' | 'active' | 'inactive';

interface PackageUserInfo {
  id?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
}

interface PackageInfo {
  id?: string;
  name?: string;
  times?: number;
  price?: number | string;
}

interface PaginationPayload {
  total?: number;
}

interface PackagePurchasePayload {
  id?: string;
  userId?: string;
  user_id?: string;
  packageId?: string;
  package_id?: string;
  remaining?: number | string;
  originalTimes?: number | string;
  original_times?: number | string;
  expiry?: DateLike;
  createdAt?: DateLike;
  created_at?: DateLike;
  updatedAt?: DateLike;
  updated_at?: DateLike;
  user?: PackageUserInfo;
  package?: PackageInfo;
}

interface AdminPackagePayload {
  id?: string;
  name?: string;
  description?: string | null;
  price?: number | string;
  times?: number | string;
  type?: string;
  active?: boolean;
  isActive?: boolean;
  validityDays?: number | string;
  validity_days?: number | string;
  createdAt?: DateLike;
  created_at?: DateLike;
  updatedAt?: DateLike;
  updated_at?: DateLike;
  imageUrl?: string | null;
  image_url?: string | null;
}

export interface PackagePurchase {
  id: string;
  userId: string;
  user_id?: string;
  packageId: string;
  package_id?: string;
  remaining: number;
  originalTimes: number;
  original_times?: number;
  expiry: DateLike;
  createdAt: DateLike;
  created_at?: DateLike;
  updatedAt?: DateLike;
  updated_at?: DateLike;
  user?: {
    id?: string;
    fullName: string;
    full_name?: string;
    email: string;
    phone?: string | null;
  };
  package?: {
    id?: string;
    name: string;
    times: number;
    price: number;
  };
}

export interface AdminPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  times: number;
  active: boolean;
  isActive?: boolean;
  type?: string;
  validityDays: number;
  validity_days?: number;
  createdAt: DateLike;
  created_at?: DateLike;
  updatedAt: DateLike;
  updated_at?: DateLike;
  imageUrl?: string | null;
  image_url?: string | null;
}

export type Package = AdminPackage;
export type UserPackage = PackagePurchase;

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDateLike(value: DateLike | null | undefined, fallback: DateLike): DateLike {
  return value ?? fallback;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return fallback;
}

function normalizeAdminPackage(payload: AdminPackagePayload): AdminPackage {
  const now = new Date();
  const id = payload.id ?? '';
  const name = payload.name ?? '';
  const description = payload.description ?? '';
  const times = toNumber(payload.times, 0);
  const price = toNumber(payload.price, 0);
  const active = payload.active ?? payload.isActive ?? true;
  const validityDays = toNumber(payload.validityDays ?? payload.validity_days, 0);
  const createdAt = toDateLike(payload.createdAt ?? payload.created_at, now);
  const updatedAt = toDateLike(payload.updatedAt ?? payload.updated_at, now);
  const imageUrl = payload.imageUrl ?? payload.image_url ?? null;

  return {
    id,
    name,
    description,
    price,
    times,
    active,
    isActive: active,
    type: payload.type ?? 'default',
    validityDays,
    validity_days: validityDays,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    imageUrl,
    image_url: imageUrl,
  };
}

function normalizePackagePurchase(payload: PackagePurchasePayload): PackagePurchase {
  const id = payload.id ?? '';
  const userId = payload.userId ?? payload.user_id ?? '';
  const packageId = payload.packageId ?? payload.package_id ?? '';
  const remaining = toNumber(payload.remaining, 0);
  const originalTimes = toNumber(payload.originalTimes ?? payload.original_times, 0);
  const createdAt = toDateLike(payload.createdAt ?? payload.created_at, new Date());
  const updatedAt = toDateLike(payload.updatedAt ?? payload.updated_at, createdAt);
  const expiry = toDateLike(payload.expiry, createdAt);

  const normalizedUser = payload.user
    ? {
        id: payload.user.id ?? '',
        fullName: payload.user.fullName ?? payload.user.full_name ?? '',
        full_name: payload.user.fullName ?? payload.user.full_name ?? '',
        email: payload.user.email ?? '',
        phone: payload.user.phone ?? null,
      }
    : undefined;

  const normalizedPackage = payload.package
    ? {
        id: payload.package.id ?? packageId,
        name: payload.package.name ?? '',
        times: toNumber(payload.package.times, 0),
        price: toNumber(payload.package.price, 0),
      }
    : undefined;

  return {
    id,
    userId,
    user_id: userId,
    packageId,
    package_id: packageId,
    remaining,
    originalTimes,
    original_times: originalTimes,
    expiry,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    user: normalizedUser,
    package: normalizedPackage,
  };
}

/**
 * 获取套餐购买历史（管理员）
 */
export async function getPackagePurchaseHistory(filters?: {
  userId?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: PackagePurchase[]; total: number; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.packageId) params.append('packageId', filters.packageId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const payload = await apiRequest<{ purchases?: PackagePurchasePayload[]; pagination?: PaginationPayload }>(
      `/api/admin/packages/purchases?${params.toString()}`
    );
    const purchases = Array.isArray(payload.purchases)
      ? payload.purchases.map(normalizePackagePurchase)
      : [];

    return { data: purchases, total: toNumber(payload.pagination?.total, 0), error: null };
  } catch (error: unknown) {
    return { data: [], total: 0, error: getErrorMessage(error, 'Failed to fetch purchase history') };
  }
}

/**
 * 获取所有套餐（管理员，包含非活跃套餐）
 */
export async function getAllPackages(filters?: {
  status?: PackageStatus;
  searchTerm?: string;
  includeInactive?: boolean;
}): Promise<{ packages: AdminPackage[]; data?: AdminPackage[]; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.searchTerm) {
    params.append('search', filters.searchTerm);
  }
  if (filters?.includeInactive !== false) {
    params.append('includeInactive', 'true');
  }
  const query = params.toString();
  const cacheKey = `admin:packages:list:${query || 'all'}`;

  return cachedRequest(cacheKey, async () => {
    try {
      const payload = await apiRequest<AdminPackagePayload[]>(`/api/admin/packages?${query}`);
      const packages = Array.isArray(payload) ? payload.map(normalizeAdminPackage) : [];
      return { packages, data: packages, error: null };
    } catch (error: unknown) {
      return { packages: [], data: [], error: getErrorMessage(error, 'Failed to fetch packages') };
    }
  }, { ttlMs: 20000 });
}

/**
 * 获取套餐统计数据
 */
export interface PackageStats {
  totalPackages: number;
  total_packages: number;
  activePackages: number;
  active_packages: number;
  totalSales: number;
  total_sales: number;
  totalRevenue: number;
  total_revenue: number;
  totalPurchases: number;
  total_purchases: number;
  thisMonthPurchases: number;
  this_month_purchases: number;
  thisMonthRevenue: number;
  this_month_revenue: number;
  mostPopularPackage?: {
    name: string;
    purchaseCount: number;
    purchase_count?: number;
  };
  most_popular_package?: {
    name: string;
    purchaseCount?: number;
    purchase_count?: number;
  };
}

export async function getPackageStats(): Promise<{ stats: PackageStats; data?: PackageStats; error: string | null }> {
  const defaultStats: PackageStats = {
    totalPackages: 0,
    total_packages: 0,
    activePackages: 0,
    active_packages: 0,
    totalSales: 0,
    total_sales: 0,
    totalRevenue: 0,
    total_revenue: 0,
    totalPurchases: 0,
    total_purchases: 0,
    thisMonthPurchases: 0,
    this_month_purchases: 0,
    thisMonthRevenue: 0,
    this_month_revenue: 0,
  };
  const cacheKey = 'admin:packages:stats';

  return cachedRequest(cacheKey, async () => {
    try {
      const payload = await apiRequest<PackageStats>('/api/admin/packages/stats');
      const stats = { ...defaultStats, ...payload };
      return { stats, data: stats, error: null };
    } catch (error: unknown) {
      return {
        stats: defaultStats,
        data: defaultStats,
        error: getErrorMessage(error, 'Failed to fetch package stats'),
      };
    }
  }, { ttlMs: 15000 });
}

/**
 * 获取套餐销售数据
 */
export interface PackageSalesData {
  packageId: string;
  package_id?: string;
  packageName: string;
  package_name?: string;
  salesCount: number;
  sales_count?: number;
  total_sold?: number;
  totalSold?: number;
  revenue: number;
  total_revenue?: number;
  totalRevenue?: number;
  activeUsers?: number;
  active_users?: number;
  period: string;
}

export async function getPackageSalesData(filters?: {
  startDate?: string;
  endDate?: string;
  packageId?: string;
}): Promise<{ salesData: PackageSalesData[]; data?: PackageSalesData[]; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.packageId) params.append('packageId', filters.packageId);
  const query = params.toString();
  const cacheKey = `admin:packages:sales:${query || 'all'}`;

  return cachedRequest(cacheKey, async () => {
    try {
      const salesData = await apiRequest<PackageSalesData[]>(`/api/admin/packages/sales?${query}`);
      return { salesData: salesData || [], data: salesData || [], error: null };
    } catch (error: unknown) {
      return { salesData: [], data: [], error: getErrorMessage(error, 'Failed to fetch sales data') };
    }
  }, { ttlMs: 30000 });
}

/**
 * 创建新套餐
 */
export interface CreatePackageInput {
  name: string;
  description?: string;
  price: number;
  sessions?: number;
  times?: number;
  type?: string;
  validity_days?: number;
  validityDays?: number;
  isActive?: boolean;
  active?: boolean;
}

export async function createPackage(input: CreatePackageInput): Promise<{ success: boolean; package?: AdminPackage; data?: AdminPackage; error: string | null }> {
  try {
    const payload = await apiRequest<AdminPackagePayload>('/api/admin/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const pkg = normalizeAdminPackage(payload);
    invalidateRequestCacheByPrefix('admin:packages');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { success: true, package: pkg, data: pkg, error: null };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to create package') };
  }
}

/**
 * 更新套餐
 */
export async function updatePackage(packageId: string, input: Partial<CreatePackageInput>): Promise<{ success: boolean; package?: AdminPackage; data?: AdminPackage; error: string | null }> {
  try {
    const payload = await apiRequest<AdminPackagePayload>(`/api/admin/packages/${packageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const pkg = normalizeAdminPackage(payload);
    invalidateRequestCacheByPrefix('admin:packages');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { success: true, package: pkg, data: pkg, error: null };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to update package') };
  }
}

/**
 * 删除套餐
 */
export async function deletePackage(packageId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiRequest(`/api/admin/packages/${packageId}`, { method: 'DELETE' });
    invalidateRequestCacheByPrefix('admin:packages');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to delete package') };
  }
}

/**
 * 切换套餐状态（启用/禁用）
 */
export async function togglePackageStatus(packageId: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiRequest(`/api/admin/packages/${packageId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: isActive }),
    });
    invalidateRequestCacheByPrefix('admin:packages');
    invalidateRequestCacheByPrefix('admin:dashboard');
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to toggle package status') };
  }
}

/**
 * 获取单个套餐（管理员）
 */
export async function getPackageById(packageId: string): Promise<{ package: AdminPackage | null; data?: AdminPackage | null; error: string | null }> {
  try {
    const payload = await apiRequest<AdminPackagePayload>(`/api/admin/packages/${packageId}`);
    const pkg = normalizeAdminPackage(payload);
    return { package: pkg, data: pkg, error: null };
  } catch (error: unknown) {
    return { package: null, data: null, error: getErrorMessage(error, 'Package not found') };
  }
}
