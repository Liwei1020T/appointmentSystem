/**
 * 业务洞察服务
 * 提供用户价值、留存率、订单趋势等数据分析
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * 获取用户生命周期价值 (LTV)
 * 计算公式：总销售额 / 总用户数
 */
export async function getUserLtv() {
  const [totalSales, totalUsers] = await Promise.all([
    prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { price: true },
    }),
    prisma.user.count({
      where: { role: 'customer' },
    }),
  ]);

  const sales = Number(totalSales._sum.price || 0);
  const ltv = totalUsers > 0 ? sales / totalUsers : 0;

  return {
    ltv: parseFloat(ltv.toFixed(2)),
    totalSales: parseFloat(sales.toFixed(2)),
    totalUsers,
  };
}

/**
 * 获取用户留存率 (复购率)
 * 计算公式：下单超过1次的用户数 / 总下单用户数
 */
export async function getRetentionRate() {
  // 获取每个用户的订单数
  const userOrderCounts = await prisma.order.groupBy({
    by: ['userId'],
    where: { status: 'completed' },
    _count: { id: true },
  });

  const totalOrderingUsers = userOrderCounts.length;
  const repeatUsers = userOrderCounts.filter((u) => u._count.id > 1).length;

  const retentionRate =
    totalOrderingUsers > 0 ? (repeatUsers / totalOrderingUsers) * 100 : 0;

  return {
    retentionRate: parseFloat(retentionRate.toFixed(2)),
    totalOrderingUsers,
    repeatUsers,
  };
}

/**
 * 获取平均客单价趋势 (最近12个月)
 */
export async function getAverageOrderValueTrend(months = 12) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const orders = await prisma.order.findMany({
    where: {
      status: 'completed',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      price: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // 按月分组
  const monthlyStats = new Map<string, { total: number; count: number }>();

  orders.forEach((order) => {
    const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
    const current = monthlyStats.get(monthKey) || { total: 0, count: 0 };
    monthlyStats.set(monthKey, {
      total: current.total + Number(order.price),
      count: current.count + 1,
    });
  });

  // 格式化结果
  const trend = Array.from(monthlyStats.entries()).map(([month, stats]) => ({
    month,
    aov: parseFloat((stats.total / stats.count).toFixed(2)),
    orderCount: stats.count,
    totalSales: parseFloat(stats.total.toFixed(2)),
  }));

  return trend;
}

/**
 * 获取热门下单时段 (按小时)
 */
export async function getPopularHours() {
  // Prisma 不直接支持按小时 group by (需要 raw query)，这里用 JS 处理
  // 对于数据量特别大的情况，建议换成 raw query
  const orders = await prisma.order.findMany({
    select: { createdAt: true },
  });

  const hourCounts = new Array(24).fill(0);

  orders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    hourCounts[hour]++;
  });

  return hourCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }));
}

/**
 * 获取综合仪表盘数据
 */
export async function getDashboardStats() {
  const [ltvData, retentionData, aovTrend, popularHours] = await Promise.all([
    getUserLtv(),
    getRetentionRate(),
    getAverageOrderValueTrend(),
    getPopularHours(),
  ]);

  return {
    ltv: ltvData,
    retention: retentionData,
    aovTrend,
    popularHours,
  };
}
