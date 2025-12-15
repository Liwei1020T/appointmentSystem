/**
 * 获取用户套餐列表 API
 * GET /api/packages/user
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const userPackages = await prisma.userPackage.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      include: {
        package: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(userPackages);
  } catch (error: any) {
    console.error('Get user packages error:', error);
    return errorResponse(error.message || '获取套餐失败', 500);
  }
}
