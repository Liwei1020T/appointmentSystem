/**
 * 会员中心 API
 * GET /api/profile/membership - 获取会员详情、权益和升级进度
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { prisma } from '@/lib/prisma';
import {
  getTierBenefits,
  getNextTierProgress,
} from '@/server/services/membership.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('请先登录', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        membershipTier: true,
        points: true,
        totalSpent: true,
        totalOrders: true,
      },
    });

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    const totalSpent = Number(user.totalSpent);
    const benefits = await getTierBenefits(user.membershipTier);
    const progress = await getNextTierProgress(
      user.membershipTier,
      totalSpent,
      user.totalOrders
    );

    return successResponse({
      currentTier: user.membershipTier,
      points: user.points,
      totalSpent,
      totalOrders: user.totalOrders,
      benefits,
      progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
