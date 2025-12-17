import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET /api/vouchers/redeemable
 * Returns redeemable vouchers for the current user.
 */
export async function GET(_request: NextRequest) {
  try {
    try {
      await requireAuth();
    } catch (error: any) {
      if (error?.json) {
        return error.json();
      }
      return errorResponse('未登录', 401);
    }
    const now = new Date();

    const vouchers = await prisma.voucher.findMany({
      where: {
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mapped = vouchers.map((voucher) => {
      const type = (voucher.type || '').toLowerCase();
      const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
      const discountValue = typeof voucher.value === 'object'
        ? voucher.value.toNumber()
        : Number(voucher.value);

      return {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase: typeof voucher.minPurchase === 'object'
          ? voucher.minPurchase.toNumber()
          : Number(voucher.minPurchase || 0),
        max_discount: null,
        points_cost: voucher.pointsCost,
        points_required: voucher.pointsCost,
        valid_from: voucher.validFrom.toISOString(),
        valid_until: voucher.validUntil.toISOString(),
        active: voucher.active,
      };
    });

    return successResponse({ vouchers: mapped });
  } catch (error: any) {
    console.error('Get redeemable vouchers error:', error);
    return errorResponse(error.message || '获取可兑换优惠券失败', 500);
  }
}
