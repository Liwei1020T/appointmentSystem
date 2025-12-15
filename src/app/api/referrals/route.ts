/**
 * 获取推荐记录 API
 * GET /api/referrals
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // 获取我推荐的用户
    const referrals = await prisma.referralLog.findMany({
      where: {
        referrerId: user.id,
      },
      include: {
        referred: {
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 统计信息
    const totalReferrals = referrals.length;
    const totalRewards = referrals.filter(r => r.rewardGiven).length;
    const rewardPoints = parseInt(process.env.REFERRAL_REWARD_POINTS || '50');

    return successResponse({
      referralCode: user.referralCode,
      referrals,
      stats: {
        totalReferrals,
        totalRewards,
        totalPointsEarned: totalRewards * rewardPoints,
      },
    });
  } catch (error: any) {
    console.error('Get referrals error:', error);
    return errorResponse(error.message || '获取推荐记录失败', 500);
  }
}
