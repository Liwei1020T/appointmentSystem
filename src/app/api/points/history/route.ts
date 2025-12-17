/**
 * Points history API
 * GET /api/points/history
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const params = request.nextUrl.searchParams;
    const type = params.get('type');
    const limit = params.get('limit');

    const logs = await prisma.pointsLog.findMany({
      where: {
        userId: user.id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return successResponse({ logs });
  } catch (error: any) {
    console.error('Get points history error:', error);
    return errorResponse(error.message || '获取积分记录失败', 500);
  }
}
