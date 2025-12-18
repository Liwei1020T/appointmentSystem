import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * Build a safe Prisma `createdAt` filter from query params.
 * - Accepts ISO date strings.
 * - When params are missing, returns `undefined` so the filter is omitted.
 */
function buildCreatedAtFilter(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return { gte: start, lte: end };
}

/**
 * Returns [startOfToday, now] in server timezone.
 */
function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return { startOfToday, now };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = buildCreatedAtFilter(startDate, endDate);
    const { startOfToday, now } = getTodayRange();

    const [total, pending, confirmed, inProgress, completed, cancelled, revenueAgg, todayTotal, todayRevenueAgg] =
      await Promise.all([
        prisma.order.count({ where: { ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.count({ where: { status: 'pending', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.count({ where: { status: 'confirmed', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.count({ where: { status: 'in_progress', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.count({ where: { status: 'completed', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.count({ where: { status: 'cancelled', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
        prisma.order.aggregate({
          // 说明：orders 表当前以 `price` 作为订单金额字段（不使用不存在的 finalPrice/final_price）。
          _sum: { price: true },
          where: { status: 'completed', ...(dateFilter ? { createdAt: dateFilter } : {}) },
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: startOfToday, lte: now },
          },
        }),
        prisma.order.aggregate({
          // 今日营业额：按“已创建的有效订单金额”统计（排除已取消）
          _sum: { price: true },
          where: {
            createdAt: { gte: startOfToday, lte: now },
            NOT: { status: 'cancelled' },
          },
        }),
      ]);

    const revenue = Number(revenueAgg._sum?.price || 0);
    const todayRevenue = Number(todayRevenueAgg._sum?.price || 0);

    return successResponse({
      total,
      pending,
      confirmed,
      in_progress: inProgress,
      completed,
      cancelled,
      revenue,
      todayTotal,
      todayRevenue,
    });
  } catch (error: any) {
    console.error('Admin order stats error:', error);
    return errorResponse(error.message || '获取订单统计失败', 500);
  }
}
