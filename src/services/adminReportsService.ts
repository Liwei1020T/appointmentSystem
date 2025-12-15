/**
 * Admin Reports Service
 * 提供管理员报表和统计数据
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportStats {
  revenue: number;
  orders: number;
  customers: number;
  period: string;
}

export async function getReportStats(period: 'today' | 'week' | 'month' | 'year'): Promise<ReportStats> {
  try {
    const response = await fetch(`/api/admin/reports?period=${period}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch report stats:', error);
    return { revenue: 0, orders: 0, customers: 0, period };
  }
}

export async function exportReport(format: 'csv' | 'pdf', period: string): Promise<Blob | null> {
  try {
    const response = await fetch(`/api/admin/reports/export?format=${format}&period=${period}`);
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error('Failed to export report:', error);
    return null;
  }
}

/**
 * 获取收入报告
 */
export interface RevenueReport {
  totalRevenue: number;
  periodRevenue: number;
  averageOrderValue?: number;
  revenueByDay: { date: string; revenue: number }[];
  revenueByDate?: { date: string; revenue: number; orders?: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  growthRate: number;
}

export async function getRevenueReport(filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<{ data: RevenueReport; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/admin/reports/revenue?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: { totalRevenue: 0, periodRevenue: 0, revenueByDay: [], revenueByCategory: [], growthRate: 0 }, error: data.error || 'Failed to fetch revenue report' };
    }
    return { data: data.data || { totalRevenue: 0, periodRevenue: 0, revenueByDay: [], revenueByCategory: [], growthRate: 0 }, error: null };
  } catch (error: any) {
    return { data: { totalRevenue: 0, periodRevenue: 0, revenueByDay: [], revenueByCategory: [], growthRate: 0 }, error: error.message || 'Failed to fetch revenue report' };
  }
}

/**
 * 获取利润分析
 */
export interface ProfitByProduct {
  name: string;
  productName?: string;
  productType?: string;
  profit: number;
  margin: number;
  revenue: number;
  quantity: number;
  cost: number;
}

export interface ProfitAnalysis {
  totalProfit: number;
  profitMargin: number;
  profitByCategory: { category: string; profit: number; margin: number }[];
  profitByProduct?: ProfitByProduct[];
  topProfitableItems: { name: string; profit: number }[];
}

export async function getProfitAnalysis(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data: ProfitAnalysis; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/admin/reports/profit?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: { totalProfit: 0, profitMargin: 0, profitByCategory: [], topProfitableItems: [] }, error: data.error || 'Failed to fetch profit analysis' };
    }
    return { data: data.data || { totalProfit: 0, profitMargin: 0, profitByCategory: [], topProfitableItems: [] }, error: null };
  } catch (error: any) {
    return { data: { totalProfit: 0, profitMargin: 0, profitByCategory: [], topProfitableItems: [] }, error: error.message || 'Failed to fetch profit analysis' };
  }
}

/**
 * 获取销售统计
 */
export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  completionRate?: number;
  packageUsageRate?: number;
  voucherUsageRate?: number;
  ordersByStatus?: { status: string; count: number }[];
  salesByDay: { date: string; sales: number; orders: number }[];
}

export async function getSalesStats(filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<{ data: SalesStats; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/admin/reports/sales?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: { totalSales: 0, totalOrders: 0, averageOrderValue: 0, conversionRate: 0, salesByDay: [] }, error: data.error || 'Failed to fetch sales stats' };
    }
    return { data: data.data || { totalSales: 0, totalOrders: 0, averageOrderValue: 0, conversionRate: 0, salesByDay: [] }, error: null };
  } catch (error: any) {
    return { data: { totalSales: 0, totalOrders: 0, averageOrderValue: 0, conversionRate: 0, salesByDay: [] }, error: error.message || 'Failed to fetch sales stats' };
  }
}

/**
 * 获取热门球线
 */
export interface TopString {
  id: string;
  stringId?: string;
  name: string;
  stringName?: string;
  brand: string;
  salesCount: number;
  quantity?: number;
  revenue: number;
  avgTension?: number;
}

export async function getTopStrings(limit: number = 10, dateRange?: DateRange): Promise<{ data: TopString[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const response = await fetch(`/api/admin/reports/top-strings?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch top strings' };
    }
    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch top strings' };
  }
}

/**
 * 获取热门套餐
 */
export interface TopPackage {
  id: string;
  packageId?: string;
  name: string;
  packageName?: string;
  type: string;
  salesCount: number;
  soldCount?: number;
  usedCount?: number;
  revenue: number;
  utilizationRate?: number;
}

export async function getTopPackages(limit: number = 10, dateRange?: DateRange): Promise<{ data: TopPackage[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const response = await fetch(`/api/admin/reports/top-packages?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch top packages' };
    }
    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch top packages' };
  }
}

/**
 * 获取用户增长统计
 */
export interface UserGrowthStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  churnRate: number;
  growthRate?: number;
  growthByDay: { date: string; newUsers: number; totalUsers: number }[];
  dailyGrowth?: { date: string; newUsers: number; cumulativeUsers: number }[];
  usersBySource?: { source: string; count: number }[];
}

export async function getUserGrowthStats(daysOrFilters?: number | {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<{ data: UserGrowthStats; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (typeof daysOrFilters === 'number') {
      params.append('days', daysOrFilters.toString());
    } else if (daysOrFilters) {
      if (daysOrFilters.startDate) params.append('startDate', daysOrFilters.startDate);
      if (daysOrFilters.endDate) params.append('endDate', daysOrFilters.endDate);
      if (daysOrFilters.period) params.append('period', daysOrFilters.period);
    }

    const response = await fetch(`/api/admin/reports/user-growth?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: { totalUsers: 0, newUsers: 0, activeUsers: 0, churnRate: 0, growthByDay: [] }, error: data.error || 'Failed to fetch user growth stats' };
    }
    return { data: data.data || { totalUsers: 0, newUsers: 0, activeUsers: 0, churnRate: 0, growthByDay: [] }, error: null };
  } catch (error: any) {
    return { data: { totalUsers: 0, newUsers: 0, activeUsers: 0, churnRate: 0, growthByDay: [] }, error: error.message || 'Failed to fetch user growth stats' };
  }
}

/**
 * 获取订单趋势
 */
export interface OrderTrends {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  ordersByDay: { date: string; pending: number; completed: number; cancelled: number }[];
  ordersByHour?: { hour: string; count: number }[];
  ordersByDayOfWeek?: { dayName: string; count: number }[];
  ordersByMonth?: { month: string; count: number; revenue: number }[];
  averageCompletionTime: number;
}

export async function getOrderTrends(filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<{ data: OrderTrends; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/admin/reports/order-trends?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: { totalOrders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0, ordersByDay: [], averageCompletionTime: 0 }, error: data.error || 'Failed to fetch order trends' };
    }
    return { data: data.data || { totalOrders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0, ordersByDay: [], averageCompletionTime: 0 }, error: null };
  } catch (error: any) {
    return { data: { totalOrders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0, ordersByDay: [], averageCompletionTime: 0 }, error: error.message || 'Failed to fetch order trends' };
  }
}

/**
 * 导出报告数据
 */
export interface ExportReportOptions {
  reportType: 'revenue' | 'sales' | 'users' | 'orders' | 'packages' | 'strings';
  format: 'csv' | 'xlsx' | 'pdf';
  startDate?: string;
  endDate?: string;
}

export async function exportReportData(
  reportTypeOrOptions: string | ExportReportOptions, 
  dateRange?: DateRange
): Promise<{ success: boolean; data?: Blob; error: string | null }> {
  try {
    const params = new URLSearchParams();
    
    if (typeof reportTypeOrOptions === 'string') {
      params.append('reportType', reportTypeOrOptions);
      params.append('format', 'csv');
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    } else {
      params.append('reportType', reportTypeOrOptions.reportType);
      params.append('format', reportTypeOrOptions.format);
      if (reportTypeOrOptions.startDate) params.append('startDate', reportTypeOrOptions.startDate);
      if (reportTypeOrOptions.endDate) params.append('endDate', reportTypeOrOptions.endDate);
    }

    const response = await fetch(`/api/admin/reports/export?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to export report' };
    }
    const blob = await response.blob();
    return { success: true, data: blob, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to export report' };
  }
}
