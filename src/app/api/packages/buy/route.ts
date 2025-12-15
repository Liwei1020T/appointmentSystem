/**
 * 购买套餐 API
 * POST /api/packages/buy
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const { packageId } = body;

    if (!packageId) {
      return errorResponse('缺少套餐 ID');
    }

    // 验证套餐
    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!packageData) {
      return errorResponse('套餐不存在', 404);
    }

    if (!packageData.active) {
      return errorResponse('套餐已下架');
    }

    if (Number(packageData.price) <= 0) {
      return errorResponse('套餐价格无效');
    }

    // 创建支付记录（实际的 user_package 在支付成功后创建）
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        packageId: packageData.id,
        amount: packageData.price,
        provider: 'manual',
        status: 'pending',
      },
    });

    return successResponse({
      paymentId: payment.id,
      packageId: packageData.id,
      packageName: packageData.name,
      amount: Number(packageData.price),
      times: packageData.times,
      validityDays: packageData.validityDays,
      paymentRequired: true,
    }, '套餐订单创建成功');

  } catch (error: any) {
    console.error('Buy package error:', error);
    return errorResponse(error.message || '购买套餐失败', 500);
  }
}
