/**
 * 管理员 - 拒绝支付 API
 * POST /api/admin/payments/[id]/reject
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
    await requireAdmin();
    const paymentId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return errorResponse('请提供拒绝原因');
    }

    // 查找支付记录
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    if (payment.status === 'success' || payment.status === 'completed') {
      return errorResponse('该支付已确认，无法拒绝');
    }

    await prisma.$transaction(async (tx) => {
      // 1. 更新支付状态
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'rejected',
          metadata: {
            ...(payment.metadata as any),
            rejectedAt: new Date().toISOString(),
            rejectReason: reason,
          },
        },
      });

      // 2. 更新订单状态
      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'payment_rejected' },
        });
      }

      // 3. 创建通知给用户（订单/套餐通用）
      await tx.notification.create({
        data: {
          userId: payment.order?.userId || payment.userId,
          title: '支付被拒绝',
          message: `您的支付未通过审核。原因：${reason}。请重新提交正确的支付凭证。`,
          type: 'payment',
          actionUrl: payment.orderId ? `/orders/${payment.orderId}` : '/profile/packages',
          read: false,
        },
      });
    });

    return successResponse({}, '支付已拒绝');
  } catch (error: any) {
    console.error('Reject payment error:', error);
    return errorResponse(error.message || '拒绝支付失败', 500);
  }
}
