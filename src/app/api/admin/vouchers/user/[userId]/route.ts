import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * 管理员 - 获取指定用户的优惠券列表
 * GET /api/admin/vouchers/user/[userId]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAdmin();
    const userId = params.userId;
    if (!userId) {
      return errorResponse('缺少用户ID', 400);
    }

    const vouchers = await prisma.userVoucher.findMany({
      where: { userId },
      include: {
        voucher: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ vouchers });
  } catch (error) {
    return handleApiError(error);
  }
}
