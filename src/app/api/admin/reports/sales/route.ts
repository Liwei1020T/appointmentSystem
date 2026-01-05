import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { buildDayKeys, parseDateRangeFromSearchParams, toDayKey } from '@/lib/reporting';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * 管理员 - 销售统计（订单维度）
 *
 * GET /api/admin/reports/sales
 * Query:
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 说明：
 * - 销售额以“已完成订单”的订单金额（orders.price）为准
 * - 额外提供：套餐使用率/优惠券使用率/完成率/状态分布
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { start, end } = parseDateRangeFromSearchParams(request.nextUrl.searchParams, {
      defaultDays: 30,
    });

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: {
        createdAt: true,
        status: true,
        price: true,
        usePackage: true,
        voucherUsedId: true,
      },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const completedOrdersCount = completedOrders.length;

    const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.price ?? 0), 0);
    const averageOrderValue =
      completedOrdersCount > 0 ? totalSales / completedOrdersCount : 0;

    // 完成率：完成/总
    const completionRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0;

    // 套餐使用率/优惠券使用率
    const packageUsageRate =
      totalOrders > 0 ? (orders.filter((o) => o.usePackage).length / totalOrders) * 100 : 0;
    const voucherUsageRate =
      totalOrders > 0
        ? (orders.filter((o) => !!o.voucherUsedId).length / totalOrders) * 100
        : 0;

    // 状态分布（用于饼图）
    const statusCounts = new Map<string, number>();
    for (const order of orders) {
      statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    }
    const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // 按天销售趋势（完成订单）
    const dayKeys = buildDayKeys(start, end);
    const salesByDayMap = new Map<string, { sales: number; orders: number }>();
    for (const order of completedOrders) {
      const key = toDayKey(order.createdAt);
      const current = salesByDayMap.get(key) ?? { sales: 0, orders: 0 };
      current.sales += Number(order.price ?? 0);
      current.orders += 1;
      salesByDayMap.set(key, current);
    }

    const salesByDay = dayKeys.map((date) => {
      const current = salesByDayMap.get(date) ?? { sales: 0, orders: 0 };
      return {
        date,
        sales: Number(current.sales.toFixed(2)),
        orders: current.orders,
      };
    });

    return successResponse({
      totalSales,
      totalOrders,
      averageOrderValue,
      // 当前没有显式 funnel 定义，先使用完成率作为 conversionRate 的近似值
      conversionRate: completionRate,
      completionRate,
      packageUsageRate,
      voucherUsageRate,
      ordersByStatus,
      salesByDay,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
