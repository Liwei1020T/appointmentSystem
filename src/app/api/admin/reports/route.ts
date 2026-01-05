import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * 管理员 - 报表概览（用于简单 KPI）
 *
 * GET /api/admin/reports?period=today|week|month|year
 *
 * 统计口径：
 * - revenue：已确认支付金额总和（payments.status in ['success','completed']）
 * - orders：订单数量（orders.createdAt in period）
 * - customers：下单用户数（orders.userId 去重）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const period = (request.nextUrl.searchParams.get('period') || 'month') as
      | 'today'
      | 'week'
      | 'month'
      | 'year';

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (period === 'today') {
      // already start of day
    } else if (period === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'month') {
      start.setDate(start.getDate() - 29);
    } else if (period === 'year') {
      start.setDate(start.getDate() - 364);
    }

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const confirmedStatuses = ['success', 'completed'];

    const [revenueAgg, orders, customers] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: { in: confirmedStatuses }, createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    return successResponse({
      revenue: Number(revenueAgg._sum.amount ?? 0),
      orders,
      customers: customers.length,
      period,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
