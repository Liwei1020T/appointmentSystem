/**
 * Home Service
 * Fetches homepage data via API routes.
 */

import { apiRequest } from '@/services/apiClient';

export interface HomeStats {
  totalOrders: number;
  activeUsers: number;
  totalReviews: number;
}

export interface FeaturedPackage {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  original_price?: number;
  originalPrice?: number;
  sessions?: number;
  sessions_included?: number;
  times?: number;
  validity?: number;
  validity_days?: number | null;
  validityDays?: number | null;
  discount_percentage?: number;
  discountPercentage?: number;
  active?: boolean;
  image_url?: string | null;
  imageUrl?: string | null;
}

export interface UserStats {
  totalOrders?: number;
  pendingOrders?: number;
  completedOrders?: number;
  pointsBalance?: number;
  points?: number;
  activePackages?: number;
  availableVouchers?: number;
  packages?: number;
  vouchers?: number;
}

export interface RecentOrder {
  id: string;
  string_id?: string;
  status: string;
  price?: number;
  final_price?: number;
  finalPrice?: number;
  tension?: number;
  created_at?: string;
  createdAt?: Date | string;
  use_package?: boolean;
  usePackage?: boolean;
  string_brand?: string;
  stringBrand?: string;
  string_name?: string;
  stringName?: string;
  string?: {
    brand?: string;
    model?: string;
    name?: string;
  };
}

/**
 * Fetch system-level stats for the homepage.
 */
export async function getHomeStats(): Promise<HomeStats> {
  try {
    return await apiRequest<HomeStats>('/api/stats');
  } catch (error) {
    console.error('Failed to fetch home stats:', error);
    return { totalOrders: 0, activeUsers: 0, totalReviews: 0 };
  }
}

/**
 * Fetch featured packages.
 */
export async function getFeaturedPackages(limit?: number): Promise<FeaturedPackage[]> {
  try {
    const query = limit ? `?limit=${limit}` : '';
    return await apiRequest<FeaturedPackage[]>(`/api/packages/featured${query}`);
  } catch (error) {
    console.error('Failed to fetch featured packages:', error);
    return [];
  }
}

/**
 * Fetch current user stats.
 */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    return await apiRequest<UserStats>('/api/user/stats');
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return null;
  }
}

/**
 * Fetch recent orders for the current user.
 */
export async function getRecentOrders(limit?: number): Promise<RecentOrder[]> {
  try {
    const query = limit ? `?limit=${limit}` : '';
    return await apiRequest<RecentOrder[]>(`/api/orders${query}`);
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return [];
  }
}
