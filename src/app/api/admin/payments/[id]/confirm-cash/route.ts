/**
 * 管理员确认现金支付 API
 * POST /api/admin/payments/[id]/confirm-cash
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const paymentId = params.id;

    // 查找支付记录
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    if (payment.provider !== 'cash') {
      return errorResponse('只能确认现金支付', 400);
    }

    if (payment.status === 'completed') {
      return errorResponse('该支付已确认', 400);
    }

    // 更新支付状态为已完成
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        metadata: {
          ...(payment.metadata as any),
          confirmed_by: admin.id,
          confirmed_at: new Date().toISOString(),
          confirmed_by_name: admin.fullName,
        },
      },
    });

    return successResponse({
      payment: updatedPayment,
      message: '现金收款已确认',
    });
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Confirm cash payment error:', error);
    return errorResponse(error.message || '确认现金支付失败', 500);
  }
}
