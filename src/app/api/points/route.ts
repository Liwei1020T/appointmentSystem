/**
 * 获取用户积分记录 API
 * GET /api/points
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');

    const pointsLogs = await prisma.pointsLog.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: parseInt(limit) }),
    });

    // 获取当前积分余额
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true },
    });

    return successResponse({
      balance: currentUser?.points || 0,
      logs: pointsLogs,
    });
  } catch (error: any) {
    console.error('Get points error:', error);
    return errorResponse(error.message || '获取积分失败', 500);
  }
}
