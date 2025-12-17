import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse({
      totalRevenue: 0,
      periodRevenue: 0,
      averageOrderValue: 0,
      revenueByDay: [],
      revenueByCategory: [],
      growthRate: 0,
    });
  } catch (error: any) {
    console.error('Revenue report error:', error);
    return errorResponse(error.message || 'Failed to fetch revenue report', 500);
  }
}
