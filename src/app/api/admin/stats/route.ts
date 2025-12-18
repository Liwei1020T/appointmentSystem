import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, todayRevenueAgg, monthOrders, monthRevenueAgg, lowStockCount, pendingOrders, activePackages] =
      await Promise.all([
        prisma.order.count({
          where: {
            createdAt: { gte: startOfDay },
          },
        }),
        prisma.order.aggregate({
          where: {
            status: 'completed',
            completedAt: { gte: startOfDay },
          },
          _sum: { price: true },
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: startOfMonth },
          },
        }),
        prisma.order.aggregate({
          where: {
            status: 'completed',
            completedAt: { gte: startOfMonth },
          },
          _sum: { price: true },
        }),
        prisma.stringInventory.count({
          where: {
            stock: { lt: 5 },
          },
        }),
        prisma.order.count({
          where: {
            status: 'pending',
          },
        }),
        prisma.userPackage.count({
          where: {
            remaining: { gt: 0 },
            expiry: { gt: now },
            status: 'active',
          },
        }),
      ]);

    return NextResponse.json({
      todayOrders,
      todayRevenue: todayRevenueAgg._sum.price || 0,
      monthOrders,
      monthRevenue: monthRevenueAgg._sum.price || 0,
      activePackages,
      lowStockItems: lowStockCount,
      pendingOrders,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
