import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    const now = new Date();
    const [
      totalVouchers,
      activeVouchers,
      inactiveVouchers,
      expiredVouchers,
      totalDistributed,
      totalUsed,
      discountAgg,
    ] = await Promise.all([
      prisma.voucher.count(),
      prisma.voucher.count({
        where: {
          active: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      }),
      prisma.voucher.count({ where: { active: false } }),
      prisma.voucher.count({ where: { validUntil: { lt: now } } }),
      prisma.userVoucher.count(),
      prisma.userVoucher.count({ where: { status: 'used' } }),
      prisma.order.aggregate({
        where: {
          voucherUsedId: { not: null },
          status: { not: 'cancelled' },
        },
        _sum: { discountAmount: true, discount: true },
      }),
    ]);
    const toNumber = (value: number | { toNumber(): number } | null | undefined) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
      return Number(value);
    };
    const totalDiscountGiven = toNumber(discountAgg._sum.discountAmount ?? discountAgg._sum.discount ?? 0);
    const usageRate = totalDistributed > 0 ? Math.round((totalUsed / totalDistributed) * 100) : 0;
    const payload = {
      // camelCase
      totalVouchers,
      activeVouchers,
      inactiveVouchers,
      expiredVouchers,
      totalDistributed,
      totalUsed,
      usageRate,
      totalDiscountGiven,
      totalRedemptions: totalUsed,
      totalDiscount: totalDiscountGiven,
      // snake_case (UI + backward compatibility)
      total_vouchers: totalVouchers,
      active_vouchers: activeVouchers,
      inactive_vouchers: inactiveVouchers,
      expired_vouchers: expiredVouchers,
      total_distributed: totalDistributed,
      total_used: totalUsed,
      usage_rate: usageRate,
      total_discount_given: totalDiscountGiven,
      total_redemptions: totalUsed,
      total_discount: totalDiscountGiven,
    };
    return successResponse(payload);
  } catch (error) {
    return handleApiError(error);
  }
}
