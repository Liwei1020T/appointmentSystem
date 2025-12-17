/**
 * Points stats API
 * GET /api/points/stats
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    const logs = await prisma.pointsLog.findMany({
      where: { userId: user.id },
      select: { amount: true, type: true },
    });

    let totalEarned = 0;
    let totalSpent = 0;
    logs.forEach((log) => {
      const amount = Number(log.amount) || 0;
      if (amount > 0) {
        totalEarned += amount;
      } else if (amount < 0) {
        totalSpent += Math.abs(amount);
      }
    });

    return successResponse({
      total_earned: totalEarned,
      total_spent: totalSpent,
    });
  } catch (error: any) {
    console.error('Get points stats error:', error);
    return errorResponse(error.message || '获取积分统计失败', 500);
  }
}
