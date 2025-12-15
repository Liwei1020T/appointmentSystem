/**
 * 获取所有可用套餐 API
 * GET /api/packages
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.package.findMany({
      where: {
        active: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    return successResponse(packages);
  } catch (error: any) {
    console.error('Get packages error:', error);
    return errorResponse(error.message || '获取套餐失败', 500);
  }
}
