import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { buildDayKeys, parseDateRangeFromSearchParams, toDayKey } from '@/lib/reporting';
import { handleApiError } from '@/lib/api/handleApiError';

/**
 * 管理员 - 订单趋势
 *
 * GET /api/admin/reports/order-trends
 * Query:
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 输出用于 AdminReportsPage：
 * - ordersByHour / ordersByDayOfWeek / ordersByMonth
 * - averageCompletionTime（小时）
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
        completedAt: true,
        status: true,
        price: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
    const pendingOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));

    // ordersByDay（用于概览）
    const dayKeys = buildDayKeys(start, end);
    const byDay = new Map<string, { pending: number; completed: number; cancelled: number }>();
    for (const order of orders) {
      const key = toDayKey(order.createdAt);
      const current = byDay.get(key) ?? { pending: 0, completed: 0, cancelled: 0 };
      if (order.status === 'completed') current.completed += 1;
      else if (order.status === 'cancelled') current.cancelled += 1;
      else current.pending += 1;
      byDay.set(key, current);
    }
    const ordersByDay = dayKeys.map((date) => ({
      date,
      ...(byDay.get(date) ?? { pending: 0, completed: 0, cancelled: 0 }),
    }));

    // ordersByHour
    const hourCounts = new Array(24).fill(0);
    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourCounts[hour] += 1;
    }
    const ordersByHour = hourCounts.map((count, hour) => ({
      hour: String(hour).padStart(2, '0'),
      count,
    }));

    // ordersByDayOfWeek
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowCounts = new Array(7).fill(0);
    for (const order of orders) {
      const dow = order.createdAt.getDay();
      dowCounts[dow] += 1;
    }
    const ordersByDayOfWeek = dowCounts.map((count, dow) => ({
      dayName: dayNames[dow],
      count,
    }));

    // ordersByMonth（YYYY-MM）
    const monthMap = new Map<string, { count: number; revenue: number }>();
    for (const order of orders) {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(month) ?? { count: 0, revenue: 0 };
      current.count += 1;
      if (order.status === 'completed') current.revenue += Number(order.price ?? 0);
      monthMap.set(month, current);
    }
    const ordersByMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        count: v.count,
        revenue: Number(v.revenue.toFixed(2)),
      }));

    // 平均完成耗时（小时）
    const completionDurations = completedOrders
      .filter((o) => o.completedAt)
      .map((o) => (Number(o.completedAt) - Number(o.createdAt)) / (1000 * 60 * 60));
    const averageCompletionTime =
      completionDurations.length > 0
        ? completionDurations.reduce((sum, h) => sum + h, 0) / completionDurations.length
        : 0;

    return successResponse({
      totalOrders,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      ordersByDay,
      ordersByHour,
      ordersByDayOfWeek,
      ordersByMonth,
      averageCompletionTime: Number(averageCompletionTime.toFixed(2)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
