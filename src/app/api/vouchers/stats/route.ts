import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/vouchers/stats
 * User-facing voucher stats
 *
 * Returns counts for:
 * - total: all vouchers owned by the current user
 * - active: not used and not expired
 * - used: consumed vouchers
 * - expired: not used but expired (including status=expired)
 * - usageRate: used / total (%)
 */
export async function GET(_request: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch (error: any) {
      if (error?.json) return error.json();
      return errorResponse('未登录', 401);
    }

    const now = new Date();

    const [total, used, active] = await Promise.all([
      prisma.userVoucher.count({ where: { userId: user.id } }),
      prisma.userVoucher.count({ where: { userId: user.id, status: 'used' } }),
      prisma.userVoucher.count({
        where: {
          userId: user.id,
          status: 'active',
          expiry: { gt: now },
        },
      }),
    ]);

    const expired = total - used - active;
    const usageRate = total > 0 ? Math.round((used / total) * 100) : 0;

    return successResponse({
      total,
      used,
      expired: Math.max(expired, 0),
      active,
      available: active,
      usageRate,
      totalVouchers: total,
      usedVouchers: used,
      expiredVouchers: Math.max(expired, 0),
      activeVouchers: active,
    });
  } catch (error: any) {
    console.error('Get voucher stats (user) error:', error);
    return errorResponse(error.message || '获取优惠券统计失败', 500);
  }
}
