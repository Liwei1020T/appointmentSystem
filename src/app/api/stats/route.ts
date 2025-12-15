/**
 * 获取系统统计信息 API
 * GET /api/stats
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // 获取总订单数
    const totalOrders = await prisma.order.count();

    // 获取活跃用户数（最近30天有订单的用户）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    // 获取总评价数
    const totalReviews = await prisma.review.count();

    const stats = {
      totalOrders,
      activeUsers: activeUsers.length,
      totalReviews,
    };

    return successResponse(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    return errorResponse(error.message || '获取统计信息失败', 500);
  }
}
