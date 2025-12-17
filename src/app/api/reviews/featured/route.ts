import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/reviews/featured
 * Placeholder featured reviews endpoint
 */
export async function GET(_request: NextRequest) {
  try {
    return successResponse({ reviews: [] });
  } catch (error: any) {
    console.error('Featured reviews error:', error);
    return errorResponse(error.message || '获取精选评价失败', 500);
  }
}
