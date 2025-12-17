import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate),
    } : undefined;

    const [total, pending, confirmed, inProgress, completed, cancelled, revenueAgg] =
      await Promise.all([
        prisma.order.count({ where: { createdAt: dateFilter } }),
        prisma.order.count({ where: { status: 'pending', createdAt: dateFilter } }),
        prisma.order.count({ where: { status: 'confirmed', createdAt: dateFilter } }),
        prisma.order.count({ where: { status: 'in_progress', createdAt: dateFilter } }),
        prisma.order.count({ where: { status: 'completed', createdAt: dateFilter } }),
        prisma.order.count({ where: { status: 'cancelled', createdAt: dateFilter } }),
        prisma.order.aggregate({
          _sum: { price: true, finalPrice: true, final_price: true as any },
          where: { status: 'completed', createdAt: dateFilter },
        }),
      ]);

    const revenue =
      Number(revenueAgg._sum.finalPrice || 0) ||
      Number((revenueAgg as any)._sum.final_price || 0) ||
      Number(revenueAgg._sum.price || 0) ||
      0;

    return successResponse({
      total,
      pending,
      confirmed,
      in_progress: inProgress,
      completed,
      cancelled,
      revenue,
      todayTotal: total,
      todayRevenue: revenue,
    });
  } catch (error: any) {
    console.error('Admin order stats error:', error);
    return errorResponse(error.message || '获取订单统计失败', 500);
  }
}
