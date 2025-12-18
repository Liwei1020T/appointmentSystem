import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { parseDateRangeFromSearchParams } from '@/lib/reporting';

/**
 * 管理员 - 热门球线（按已完成订单聚合）
 *
 * GET /api/admin/reports/top-strings
 * Query:
 * - limit?: number (default 10)
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.max(1, Number(searchParams.get('limit') || 10));
    const { start, end } = parseDateRangeFromSearchParams(searchParams, { defaultDays: 30 });

    const orders = await prisma.order.findMany({
      where: {
        status: 'completed',
        stringId: { not: null },
        createdAt: { gte: start, lte: end },
      },
      select: {
        stringId: true,
        price: true,
        tension: true,
        string: { select: { brand: true, model: true } },
      },
    });

    const acc = new Map<
      string,
      {
        stringId: string;
        stringName: string;
        brand: string;
        quantity: number;
        revenue: number;
        tensionSum: number;
        tensionCount: number;
      }
    >();

    for (const order of orders) {
      const sid = order.stringId as string;
      const brand = order.string?.brand || '';
      const model = order.string?.model || '';
      const name = `${brand} ${model}`.trim() || 'String';
      const current = acc.get(sid) ?? {
        stringId: sid,
        stringName: name,
        brand,
        quantity: 0,
        revenue: 0,
        tensionSum: 0,
        tensionCount: 0,
      };
      current.quantity += 1;
      current.revenue += Number(order.price ?? 0);
      if (order.tension !== null && order.tension !== undefined) {
        current.tensionSum += Number(order.tension);
        current.tensionCount += 1;
      }
      acc.set(sid, current);
    }

    const data = Array.from(acc.values())
      .map((row) => ({
        id: row.stringId,
        stringId: row.stringId,
        name: row.stringName,
        stringName: row.stringName,
        brand: row.brand,
        salesCount: row.quantity,
        quantity: row.quantity,
        revenue: Number(row.revenue.toFixed(2)),
        avgTension: row.tensionCount > 0 ? row.tensionSum / row.tensionCount : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return successResponse(data);
  } catch (error: any) {
    console.error('Top strings error:', error);
    return errorResponse(error.message || 'Failed to fetch top strings', 500);
  }
}

