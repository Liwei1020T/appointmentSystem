import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse({
      totalUsers: 0,
      newUsers: 0,
      activeUsers: 0,
      churnRate: 0,
      growthByDay: [],
    });
  } catch (error: any) {
    console.error('User growth error:', error);
    return errorResponse(error.message || 'Failed to fetch user growth stats', 500);
  }
}
