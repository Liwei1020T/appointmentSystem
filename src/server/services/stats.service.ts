import { prisma } from '@/lib/prisma';

async function countLowStockItems() {
  const inventory = await prisma.stringInventory.findMany({
    where: { active: true },
    select: { stock: true, minimumStock: true },
  });

  return inventory.filter((item) => item.stock <= item.minimumStock).length;
}

/**
 * Fetch system-level stats for the homepage.
 */
export async function getSystemStats() {
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

/**
 * Fetch admin KPI stats (daily/monthly).
 */
export async function getAdminStats() {
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
      countLowStockItems(),
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

  return {
    todayOrders,
    todayRevenue: todayRevenueAgg._sum.price || 0,
    monthOrders,
    monthRevenue: monthRevenueAgg._sum.price || 0,
    activePackages,
    lowStockItems: lowStockCount,
    pendingOrders,
  };
}

/**
 * Fetch admin dashboard stats + recent orders list.
 */
export async function getAdminDashboardStats(recentOrdersLimit: number) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders,
    todayRevenueAgg,
    monthOrders,
    monthRevenueAgg,
    lowStockCount,
    pendingOrders,
    activePackages,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.order.aggregate({
      where: {
        status: 'completed',
        completedAt: { gte: startOfDay },
      },
      _sum: { price: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.order.aggregate({
      where: {
        status: 'completed',
        completedAt: { gte: startOfMonth },
      },
      _sum: { price: true },
    }),
    countLowStockItems(),
    prisma.order.count({
      where: { status: 'pending' },
    }),
    prisma.userPackage.count({
      where: {
        remaining: { gt: 0 },
        expiry: { gt: now },
        status: 'active',
      },
    }),
    prisma.order.findMany({
      take: recentOrdersLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        string: {
          select: { brand: true, model: true },
        },
      },
    }),
  ]);

  return {
    stats: {
      todayOrders,
      todayRevenue: todayRevenueAgg._sum.price || 0,
      monthOrders,
      monthRevenue: monthRevenueAgg._sum.price || 0,
      activePackages,
      lowStockItems: lowStockCount,
      pendingOrders,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      user_name: order.user?.fullName || order.user?.email || 'User',
      string_name: order.string ? `${order.string.brand || ''} ${order.string.model || ''}`.trim() : '',
      total_price: Number(order.price || 0),
      status: order.status,
      created_at: order.createdAt,
    })),
  };
}
