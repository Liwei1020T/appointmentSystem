import { apiRequest } from '@/services/apiClient';

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

export async function getDashboardStats(limit = 5): Promise<DashboardStatsResponse> {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest<DashboardStatsResponse>(`/api/admin/dashboard-stats${query}`);
}
