/**
 * 促销活动管理 API
 * GET /api/admin/promotions - 获取活动列表
 * POST /api/admin/promotions - 创建新活动
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { prisma } from '@/lib/prisma';
import { PromotionType, DiscountType } from '@prisma/client';
import { z } from 'zod';

const createPromotionSchema = z.object({
  name: z.string().min(1, '活动名称不能为空'),
  type: z.nativeEnum(PromotionType),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive('折扣值必须大于0'),
  minPurchase: z.number().min(0).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(promotions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = createPromotionSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('无效的活动数据', 400, result.error.flatten());
    }

    const data = result.data;

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase || 0,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        usageLimit: data.usageLimit,
        isActive: true,
      },
    });

    return successResponse(promotion, '活动创建成功');
  } catch (error) {
    return handleApiError(error);
  }
}
