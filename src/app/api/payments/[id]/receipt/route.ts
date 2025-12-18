/**
 * 支付收据上传 API
 * POST /api/payments/[id]/receipt - 上传支付收据
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params.id;

    // 验证支付记录存在且属于当前用户
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: user.id,
      },
    });

    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }

    const body = await request.json();
    const { receiptUrl } = body;

    if (!receiptUrl) {
      return errorResponse('缺少收据URL', 400);
    }

    // 更新支付记录：合并 metadata，写入收据，并进入“待审核”状态
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...(payment.metadata as any),
          // 兼容旧字段：部分管理端页面仍读取 proofUrl
          proofUrl: (payment.metadata as any)?.proofUrl || receiptUrl,
          receiptUrl,
          uploadedAt: new Date().toISOString(),
        },
        status: 'pending_verification', // 等待管理员审核
      },
    });

    return successResponse(updatedPayment);
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    return errorResponse(error.message || '上传收据失败', 500);
  }
}
