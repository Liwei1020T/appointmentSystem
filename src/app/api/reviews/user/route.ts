import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/reviews/user
 * Returns current user's reviews (stubbed empty array)
 */
export async function GET(_request: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch {
      // allow non-admin
    }
    return successResponse({ reviews: [] });
  } catch (error: any) {
    console.error('Get user reviews error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
