/**
 * Admin - Voucher users API
 * GET /api/admin/vouchers/[id]/users
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const voucherId = params.id;
    if (!isValidUUID(voucherId)) return errorResponse('无效的优惠券ID', 400);

    const userVouchers = await prisma.userVoucher.findMany({
      where: { voucherId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    const mapped = userVouchers.map((uv) => ({
      id: uv.id,
      status: uv.status === 'active' ? 'available' : uv.status,
      usedAt: uv.usedAt,
      used_at: uv.usedAt,
      created_at: uv.createdAt,
      user: {
        id: uv.user?.id,
        full_name: uv.user?.fullName,
        email: uv.user?.email,
        phone: uv.user?.phone,
      },
    }));

    return successResponse({ data: mapped }, '获取优惠券用户列表成功');
  } catch (error) {
    return handleApiError(error);
  }
}
