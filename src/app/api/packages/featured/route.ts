/**
 * 获取精选套餐 API
 * GET /api/packages/featured
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    const packages = await prisma.package.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { price: 'asc' },
      ],
      take: limit,
    });

    return successResponse(packages);
  } catch (error: any) {
    console.error('Get featured packages error:', error);
    return errorResponse(error.message || '获取精选套餐失败', 500);
  }
}
