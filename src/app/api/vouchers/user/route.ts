/**
 * 获取用户优惠券 API
 * GET /api/vouchers/user
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const userVouchers = await prisma.userVoucher.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      include: {
        voucher: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(userVouchers);
  } catch (error: any) {
    console.error('Get user vouchers error:', error);
    return errorResponse(error.message || '获取优惠券失败', 500);
  }
}
