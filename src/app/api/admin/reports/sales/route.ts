import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse({
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      salesByDay: [],
    });
  } catch (error: any) {
    console.error('Sales stats error:', error);
    return errorResponse(error.message || 'Failed to fetch sales stats', 500);
  }
}
