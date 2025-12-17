import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/vouchers
 * Returns current user's vouchers with UI-friendly fields.
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated; if auth fails, return 401
    try {
      const user = await requireAuth();
      const status = request.nextUrl.searchParams.get('status');
      const userVouchers = await prisma.userVoucher.findMany({
        where: {
          userId: user.id,
          ...(status ? { status } : {}),
        },
        include: {
          voucher: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const mapped = userVouchers.map((uv) => {
        const voucher = uv.voucher;
        const type = (voucher.type || '').toLowerCase();
        const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
        const discountValue = typeof voucher.value === 'object'
          ? voucher.value.toNumber()
          : Number(voucher.value);

        return {
          id: uv.id,
          user_id: uv.userId,
          voucher_id: uv.voucherId,
          status: uv.status,
          used_at: uv.usedAt ? uv.usedAt.toISOString() : null,
          order_id: uv.orderId,
          expiry: uv.expiry.toISOString(),
          created_at: uv.createdAt.toISOString(),
          used: uv.status === 'used',
          expires_at: uv.expiry.toISOString(),
          voucher: {
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            discount_type: discountType,
            discount_value: discountValue,
            min_purchase: typeof voucher.minPurchase === 'object'
              ? voucher.minPurchase.toNumber()
              : Number(voucher.minPurchase || 0),
            max_discount: null,
            description: null,
          },
        };
      });

      return successResponse({ vouchers: mapped });
    } catch {
      return errorResponse('未登录', 401);
    }
  } catch (error: any) {
    console.error('Get user vouchers error:', error);
    return errorResponse(error.message || '获取用户优惠券失败', 500);
  }
}
