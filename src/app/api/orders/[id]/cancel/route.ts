/**
 * 订单取消 API
 * POST /api/orders/[id]/cancel
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    // 查找订单
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        payments: true,
      },
    });

    if (!order) {
      return errorResponse('订单不存在', 404);
    }

    if (order.status !== 'pending') {
      return errorResponse('只能取消待处理的订单');
    }

    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });

      // 如果有支付记录，标记为取消
      if (order.payments.length > 0) {
        await tx.payment.updateMany({
          where: {
            orderId,
            status: 'pending',
          },
          data: { status: 'cancelled' },
        });
      }

      // 如果使用了套餐，退还次数
      if (order.packageUsedId) {
        await tx.userPackage.update({
          where: { id: order.packageUsedId },
          data: {
            remaining: { increment: 1 },
          },
        });
      }

      // 创建通知
      await tx.notification.create({
        data: {
          userId: user.id,
          title: '订单已取消',
          message: `订单 #${orderId.slice(0, 8)} 已成功取消`,
          type: 'order',
          actionUrl: `/orders/${orderId}`,
          read: false,
        },
      });
    });

    return successResponse({}, '订单已取消');
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return errorResponse(error.message || '取消订单失败', 500);
  }
}
