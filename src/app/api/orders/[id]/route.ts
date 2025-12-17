/**
 * 获取单个订单详情 API
 * GET /api/orders/[id]
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        string: true,
        payments: true,
        packageUsed: {
          include: {
            package: true,
          },
        },
        voucherUsed: {
          include: {
            voucher: true,
          },
        },
      },
    });

    if (!order) {
      return errorResponse('订单不存在', 404);
    }

    return successResponse(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    return errorResponse(error.message || '获取订单失败', 500);
  }
}
