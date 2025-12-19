/**
 * Admin - User vouchers API
 * GET /api/admin/users/[id]/vouchers
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const userVouchers = await prisma.userVoucher.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { voucher: true },
    });

    const mapped = userVouchers.map((uv) => {
      const voucher = uv.voucher;
      const type = (voucher.type || '').toLowerCase();
      const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
      const discountValue = typeof voucher.value === 'object' ? voucher.value.toNumber() : Number(voucher.value);

      return {
        id: uv.id,
        status: uv.status,
        isUsed: uv.status === 'used',
        is_used: uv.status === 'used',
        usedAt: uv.usedAt,
        used_at: uv.usedAt,
        expiryDate: uv.expiry,
        expiry_date: uv.expiry,
        voucher: {
          code: voucher.code,
          type: voucher.type,
          value: discountValue,
          discount_type: discountType,
          discount_value: discountValue,
        },
        code: voucher.code,
        description: voucher.name,
        discountType,
        discount_type: discountType,
        discountValue,
        discount_value: discountValue,
      };
    });

    return successResponse({ data: mapped }, '获取优惠券成功');
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Admin get user vouchers error:', error);
    return errorResponse(error.message || '获取用户优惠券失败', 500);
  }
}

