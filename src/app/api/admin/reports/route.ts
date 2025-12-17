import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

// Basic reports summary placeholder
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const period = request.nextUrl.searchParams.get('period') || 'month';
    return successResponse({
      revenue: 0,
      orders: 0,
      customers: 0,
      period,
    });
  } catch (error: any) {
    console.error('Reports summary error:', error);
    return errorResponse(error.message || 'Failed to load reports', 500);
  }
}
