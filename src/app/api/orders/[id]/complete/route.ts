/**
 * 完成订单 API
 * POST /api/orders/[id]/complete
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const orderId = params.id;
    const body = await request.json();
    const { adminNotes } = body;

    // 获取订单信息
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        string: true,
      },
    });

    if (!order) {
      return errorResponse('订单不存在', 404);
    }

    if (order.status === 'completed') {
      return errorResponse('订单已完成');
    }

    if (order.status !== 'in_progress') {
      return errorResponse('只能完成进行中的订单');
    }

    if (!order.stringId || !order.string) {
      return errorResponse('订单没有关联球线');
    }

    // 检查库存
    const stockToDeduct = 11;
    if (order.string.stock < stockToDeduct) {
      return errorResponse(`库存不足，当前: ${order.string.stock}m，需要: ${stockToDeduct}m`);
    }

    /**
     * 计算积分（新规则）
     * - 积分 = 订单总额的 50%
     * - 以支付金额优先（payment.amount），回退到订单 price
     * - 积分为整数：向下取整
     */
    const profit = Number(order.price) - Number(order.cost || 0);
    const latestPayment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      select: { amount: true },
    });
    const orderTotalAmount = Number(latestPayment?.amount ?? order.price ?? 0);
    const pointsPerOrder = Math.max(0, Math.floor(orderTotalAmount * 0.5));

    // 执行事务
    await prisma.$transaction(async (tx) => {
      // 1. 扣减库存
      await tx.stringInventory.update({
        where: { id: order.stringId! },
        data: {
          stock: { decrement: stockToDeduct },
        },
      });

      // 2. 记录库存日志
      await tx.stockLog.create({
        data: {
          stringId: order.stringId!,
          change: -stockToDeduct,
          type: 'sale',
          costPrice: order.string!.costPrice,
          referenceId: orderId,
          notes: `订单完成自动扣减: ${adminNotes || ''}`,
          createdBy: admin.id,
        },
      });

      // 3. 发放积分
      const newBalance = order.user.points + pointsPerOrder;
      await tx.user.update({
        where: { id: order.userId },
        data: { points: newBalance },
      });

      await tx.pointsLog.create({
        data: {
          userId: order.userId,
          amount: pointsPerOrder,
          type: 'order',
          referenceId: orderId,
          description: `订单完成奖励：订单总额 RM${orderTotalAmount.toFixed(2)} × 50% = ${pointsPerOrder} 积分`,
          balanceAfter: newBalance,
        },
      });

      // 4. 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'completed',
          profit,
          completedAt: new Date(),
        },
      });

      // 5. 创建通知
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: '订单已完成',
          message: `您的订单已完成，订单总额 RM${orderTotalAmount.toFixed(2)}，获得 ${pointsPerOrder} 积分（50%）`,
          type: 'order',
          actionUrl: `/orders/${orderId}`,
        },
      });
    });

    return successResponse({
      orderId,
      status: 'completed',
      profit,
      pointsGranted: pointsPerOrder,
      stockDeducted: stockToDeduct,
    }, '订单完成成功');

  } catch (error: any) {
    console.error('Complete order error:', error);
    return errorResponse(error.message || '完成订单失败', 500);
  }
}
