/**
 * 获取支付详情 API
 * GET /api/payments/[id]
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params.id;

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
            string: true,
          },
        },
      },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    // 验证权限（用户只能查看自己的，管理员可以查看所有）
    if (user.role !== 'admin' && payment.order && payment.order.userId !== user.id) {
      return errorResponse('无权查看此支付记录', 403);
    }

    return successResponse(payment);
  } catch (error: any) {
    console.error('Get payment error:', error);
    return errorResponse(error.message || '获取支付信息失败', 500);
  }
}
