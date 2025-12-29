import { apiRequest } from '@/services/apiClient';
import { cachedRequest, type RequestCacheOptions } from '@/services/requestCache';

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  activePackages: number;
  lowStockItems: number;
  pendingOrders: number;
}

export interface RecentOrder {
  id: string;
  user_name: string;
  string_name: string;
  total_price: number;
  status: string;
  created_at: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
}

export async function getDashboardStats(
  limit = 5,
  options?: RequestCacheOptions
): Promise<DashboardStatsResponse> {
  const query = limit ? `?limit=${limit}` : '';
  const cacheKey = `admin:dashboard:stats:${limit || 'all'}`;

  return cachedRequest(
    cacheKey,
    () => apiRequest<DashboardStatsResponse>(`/api/admin/dashboard-stats${query}`),
    { ttlMs: 8000, skipCache: options?.skipCache }
  );
}
