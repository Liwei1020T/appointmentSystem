/**
 * 获取精选评价 API
 * GET /api/reviews/featured
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6');

    const reviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 }, // 只显示 4 星及以上的评价
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return successResponse(reviews);
  } catch (error: any) {
    console.error('Get featured reviews error:', error);
    return errorResponse(error.message || '获取精选评价失败', 500);
  }
}
