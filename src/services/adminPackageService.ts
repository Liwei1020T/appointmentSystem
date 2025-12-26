/**
 * Admin Package Service
 * Re-export from package.service.ts for backward compatibility
 */

import { apiRequest } from '@/services/apiClient';

export * from './packageService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Package = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UserPackage = any;

export type PackageStatus = 'all' | 'active' | 'inactive';

export interface PackagePurchase {
  id: string;
  userId: string;
  packageId: string;
  purchaseDate: Date;
  amount: number;
  status: string;
  user?: {
    fullName: string;
    email: string;
  };
  package?: {
    name: string;
    type: string;
  };
}

export interface AdminPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  sessions: number;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

    const payload = await apiRequest<{ purchases: PackagePurchase[]; pagination?: { total?: number } }>(
      `/api/admin/packages/purchases?${params.toString()}`
    );
    return { data: payload.purchases || [], total: payload.pagination?.total || 0, error: null };
  } catch (error: any) {
    return { data: [], total: 0, error: error.message || 'Failed to fetch purchase history' };
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
  try {
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

    const packages = await apiRequest<AdminPackage[]>(`/api/admin/packages?${params.toString()}`);
    return { packages, data: packages, error: null };
  } catch (error: any) {
    return { packages: [], data: [], error: error.message || 'Failed to fetch packages' };
  }
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
  try {
    const payload = await apiRequest<PackageStats>('/api/admin/packages/stats');
    const stats = { ...defaultStats, ...payload };
    return { stats, data: stats, error: null };
  } catch (error: any) {
    return { stats: defaultStats, data: defaultStats, error: error.message || 'Failed to fetch package stats' };
  }
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
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.packageId) params.append('packageId', filters.packageId);

    const salesData = await apiRequest<PackageSalesData[]>(`/api/admin/packages/sales?${params.toString()}`);
    return { salesData: salesData || [], data: salesData || [], error: null };
  } catch (error: any) {
    return { salesData: [], data: [], error: error.message || 'Failed to fetch sales data' };
  }
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
    const pkg = await apiRequest<AdminPackage>('/api/admin/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return { success: true, package: pkg, data: pkg, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create package' };
  }
}

/**
 * 更新套餐
 */
export async function updatePackage(packageId: string, input: Partial<CreatePackageInput>): Promise<{ success: boolean; package?: AdminPackage; data?: AdminPackage; error: string | null }> {
  try {
    const pkg = await apiRequest<AdminPackage>(`/api/admin/packages/${packageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return { success: true, package: pkg, data: pkg, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update package' };
  }
}

/**
 * 删除套餐
 */
export async function deletePackage(packageId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiRequest(`/api/admin/packages/${packageId}`, { method: 'DELETE' });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete package' };
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
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle package status' };
  }
}

/**
 * 获取单个套餐（管理员）
 */
export async function getPackageById(packageId: string): Promise<{ package: AdminPackage | null; data?: AdminPackage | null; error: string | null }> {
  try {
    const pkg = await apiRequest<AdminPackage>(`/api/admin/packages/${packageId}`);
    return { package: pkg, data: pkg, error: null };
  } catch (error: any) {
    return { package: null, data: null, error: error.message || 'Package not found' };
  }
}
