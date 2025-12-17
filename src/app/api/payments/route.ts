/**
 * 支付 API
 * POST /api/payments - 创建支付记录
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      amount,
      orderId,
      packageId,
      paymentMethod = 'tng',
    } = body;

    // 验证必填字段
    if (!amount || (!orderId && !packageId)) {
      return errorResponse('缺少必填字段', 400);
    }

    // 创建支付记录
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderId || null,
        packageId: packageId || null,
        amount: Number(amount),
        provider: paymentMethod,
        status: 'pending',
      },
    });

    return successResponse(payment);
  } catch (error: any) {
    console.error('Create payment error:', error);
    return errorResponse(error.message || '创建支付失败', 500);
  }
}
