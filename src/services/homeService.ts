/**
 * Home Service
 * 首页数据获取服务
 */

import { getSystemStatsAction } from '@/actions/stats.actions';
import { getUserStatsAction } from '@/actions/profile.actions';
import { getUserOrdersAction } from '@/actions/orders.actions';
import { getFeaturedPackagesAction } from '@/actions/packages.actions';
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

export async function getHomeStats(): Promise<HomeStats> {
  try {
    return await getSystemStatsAction();
  } catch (error) {
    console.error('Failed to fetch home stats:', error);
    return { totalOrders: 0, activeUsers: 0, totalReviews: 0 };
  }
}

export async function getFeaturedPackages(limit?: number): Promise<FeaturedPackage[]> {
  try {
    return await getFeaturedPackagesAction(limit || 3);
  } catch (error) {
    console.error('Failed to fetch featured packages:', error);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId?: string): Promise<UserStats | null> {
  try {
    return await getUserStatsAction();
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return null;
  }
}

/**
 * Get recent orders
 */
export async function getRecentOrders(userId?: string, limit?: number): Promise<RecentOrder[]> {
  try {
    const orders = await getUserOrdersAction({ limit: limit || 5 });
    return orders || [];
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return [];
  }
}
