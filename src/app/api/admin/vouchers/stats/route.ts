import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse({
      totalVouchers: 0,
      total_vouchers: 0,
      activeVouchers: 0,
      active_vouchers: 0,
      totalRedemptions: 0,
      total_redemptions: 0,
      totalDiscount: 0,
      total_discount: 0,
      inactiveVouchers: 0,
      expiredVouchers: 0,
      total_distributed: 0,
      total_used: 0,
      usage_rate: 0,
      total_discount_given: 0,
    });
  } catch (error: any) {
    console.error('Get voucher stats error:', error);
    return errorResponse(error.message || '获取优惠券统计失败', 500);
  }
}
