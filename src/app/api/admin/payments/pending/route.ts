/**
 * 管理员 - 获取待审核支付 API
 * GET /api/admin/payments/pending
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    /**
     * 待审核支付定义：
     * - TNG/手动收据：用户上传凭证后进入 `pending_verification`
     * - 现金支付：创建后为 `pending` / `pending_verification`，等待管理员确认收款（无需收据）
     *
     * 注意：支付凭证 URL 存在 `payments.metadata` 中（receiptUrl/proofUrl），不存在单独的 proofUrl 列。
     */
    const where: Prisma.PaymentWhereInput = {
      OR: [
        { provider: { not: 'cash' }, status: 'pending_verification' },
        { provider: 'cash', status: { in: ['pending', 'pending_verification'] } },
      ],
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
          order: {
            include: {
              string: {
                select: {
                  brand: true,
                  model: true,
                },
              },
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              times: true,
              validityDays: true,
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return successResponse({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get pending payments error:', error);
    return errorResponse(error.message || '获取待审核支付失败', 500);
  }
}
