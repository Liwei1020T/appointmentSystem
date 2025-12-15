/**
 * 获取用户统计信息 API
 * GET /api/user/stats
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // 获取订单统计
    const totalOrders = await prisma.order.count({
      where: { userId: user.id },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    const completedOrders = await prisma.order.count({
      where: {
        userId: user.id,
        status: 'completed',
      },
    });

    // 获取套餐统计
    const activePackages = await prisma.userPackage.count({
      where: {
        userId: user.id,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
    });

    const totalPackageCount = await prisma.userPackage.aggregate({
      where: {
        userId: user.id,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
      _sum: {
        remaining: true,
      },
    });

    // 获取优惠券统计
    const availableVouchers = await prisma.userVoucher.count({
      where: {
        userId: user.id,
        status: 'active',
        expiry: { gt: new Date() },
      },
    });

    // 获取积分
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        points: true,
      },
    });

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      activePackages,
      remainingPackageCount: totalPackageCount._sum.remaining || 0,
      availableVouchers,
      points: userProfile?.points || 0,
    };

    return successResponse(stats);
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return errorResponse(error.message || '获取用户统计失败', 500);
  }
}
