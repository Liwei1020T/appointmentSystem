import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { buildDayKeys, parseDateRangeFromSearchParams, toDayKey } from '@/lib/reporting';

/**
 * 管理员 - 收入报表
 *
 * GET /api/admin/reports/revenue
 * Query:
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 统计口径：
 * - 收入以已确认支付为准：payments.status in ['success','completed']
 * - 同时包含订单支付与套餐购买支付
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { start, end } = parseDateRangeFromSearchParams(request.nextUrl.searchParams, {
      defaultDays: 30,
    });

    const confirmedStatuses = ['success', 'completed'];

    const [payments, ordersInRange, prevRevenueAgg] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: { in: confirmedStatuses },
          createdAt: { gte: start, lte: end },
        },
        select: {
          amount: true,
          createdAt: true,
          orderId: true,
          packageId: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, status: true },
      }),
      // 计算上一周期的收入用于 growthRate（与当前区间等长）
      (async () => {
        const days = buildDayKeys(start, end).length;
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - days);
        const prevEnd = new Date(end);
        prevEnd.setDate(prevEnd.getDate() - days);
        return prisma.payment.aggregate({
          where: {
            status: { in: confirmedStatuses },
            createdAt: { gte: prevStart, lte: prevEnd },
          },
          _sum: { amount: true },
        });
      })(),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    // 订单数量按订单表统计（用于图表 orders 线）
    const ordersByDay = new Map<string, number>();
    for (const order of ordersInRange) {
      const key = toDayKey(order.createdAt);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    }

    // 收入按支付记录统计（订单支付 + 套餐支付）
    const revenueByDay = new Map<string, number>();
    let orderPaymentsRevenue = 0;
    for (const payment of payments) {
      const key = toDayKey(payment.createdAt);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(payment.amount ?? 0));
      if (payment.orderId) orderPaymentsRevenue += Number(payment.amount ?? 0);
    }

    const completedOrdersCount = ordersInRange.filter((o) => o.status === 'completed').length;
    const averageOrderValue =
      completedOrdersCount > 0 ? orderPaymentsRevenue / completedOrdersCount : 0;

    const dayKeys = buildDayKeys(start, end);
    const revenueByDate = dayKeys.map((date) => ({
      date,
      revenue: Number((revenueByDay.get(date) ?? 0).toFixed(2)),
      orders: ordersByDay.get(date) ?? 0,
    }));

    // 分类收入（订单 vs 套餐）
    const orderRevenue = payments
      .filter((p) => p.orderId && !p.packageId)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const packageRevenue = payments
      .filter((p) => p.packageId)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    const prevRevenue = Number(prevRevenueAgg._sum.amount ?? 0);
    const growthRate =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return successResponse({
      totalRevenue,
      periodRevenue: totalRevenue,
      averageOrderValue,
      revenueByDay: revenueByDate.map((r) => ({ date: r.date, revenue: r.revenue })),
      revenueByDate,
      revenueByCategory: [
        { category: 'orders', revenue: Number(orderRevenue.toFixed(2)) },
        { category: 'packages', revenue: Number(packageRevenue.toFixed(2)) },
      ],
      growthRate,
    });
  } catch (error: any) {
    console.error('Revenue report error:', error);
    return errorResponse(error.message || 'Failed to fetch revenue report', 500);
  }
}
