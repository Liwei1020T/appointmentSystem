'use server';

import { prisma } from '@/lib/prisma';

/**
 * 获取系统统计信息（Server Action）
 */
export async function getSystemStatsAction() {
  const totalOrders = await prisma.order.count();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsers = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    distinct: ['userId'],
    select: { userId: true },
  });

  const totalReviews = await prisma.review.count();

  return {
    totalOrders,
    activeUsers: activeUsers.length,
    totalReviews,
  };
}
