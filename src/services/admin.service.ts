/**
 * Admin Service - Basic admin functions
 */

export interface AdminStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockCount: number;
  pendingOrders: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch('/api/admin/stats');
  return response.json();
}
