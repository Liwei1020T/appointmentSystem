/**
 * Legacy endpoint: My vouchers
 *
 * GET /api/vouchers/my
 *
 * Note:
 * - Some legacy UI code calls this endpoint.
 * - The canonical endpoint is `GET /api/user/vouchers`.
 * - This route keeps backward compatibility and prevents 404/HTML responses in clients.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
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
      const discountValue = typeof voucher.value === 'object' ? voucher.value.toNumber() : Number(voucher.value);
      const minPurchase = typeof voucher.minPurchase === 'object'
        ? voucher.minPurchase.toNumber()
        : Number(voucher.minPurchase || 0);

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
          min_purchase: minPurchase,
          max_discount: null,
          description: null,
        },
      };
    });

    return successResponse({ vouchers: mapped });
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Get my vouchers error:', error);
    return errorResponse(error.message || '获取优惠券失败', 500);
  }
}

