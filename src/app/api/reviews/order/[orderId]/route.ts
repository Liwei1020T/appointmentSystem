import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/reviews/order/[orderId]
 * Placeholder for fetching a single order review
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    if (!orderId) return errorResponse('缺少订单ID', 400);
    return successResponse({ review: null });
  } catch (error: any) {
    console.error('Get order review error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
