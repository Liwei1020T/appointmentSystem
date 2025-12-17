import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/vouchers/stats
 * User-facing voucher stats placeholder to avoid 404/HTML errors.
 */
export async function GET(_request: NextRequest) {
  try {
    return successResponse({
      total: 0,
      used: 0,
      expired: 0,
      active: 0,
      usageRate: 0,
    });
  } catch (error: any) {
    console.error('Get voucher stats (user) error:', error);
    return errorResponse(error.message || '获取优惠券统计失败', 500);
  }
}
