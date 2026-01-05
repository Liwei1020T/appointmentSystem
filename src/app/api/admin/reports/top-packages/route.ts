import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { parseDateRangeFromSearchParams } from '@/lib/reporting';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * 管理员 - 热门套餐（按已确认套餐支付聚合）
 *
 * GET /api/admin/reports/top-packages
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

    const confirmedStatuses = ['success', 'completed'];

    const payments = await prisma.payment.findMany({
      where: {
        packageId: { not: null },
        status: { in: confirmedStatuses },
        createdAt: { gte: start, lte: end },
      },
      select: {
        packageId: true,
        amount: true,
        package: { select: { id: true, name: true, times: true } },
      },
    });

    const acc = new Map<
      string,
      {
        packageId: string;
        packageName: string;
        times: number;
        soldCount: number;
        revenue: number;
      }
    >();

    for (const payment of payments) {
      const pid = payment.packageId as string;
      const pkgName = payment.package?.name || 'Package';
      const times = payment.package?.times ?? 0;
      const current = acc.get(pid) ?? {
        packageId: pid,
        packageName: pkgName,
        times,
        soldCount: 0,
        revenue: 0,
      };
      current.soldCount += 1;
      current.revenue += Number(payment.amount ?? 0);
      acc.set(pid, current);
    }

    const packageIds = Array.from(acc.keys());
    const userPackages = await prisma.userPackage.findMany({
      where: { packageId: { in: packageIds } },
      select: { packageId: true, originalTimes: true, remaining: true },
    });

    const usedCountByPackage = new Map<string, number>();
    for (const up of userPackages) {
      const used = Math.max(Number(up.originalTimes ?? 0) - Number(up.remaining ?? 0), 0);
      usedCountByPackage.set(up.packageId, (usedCountByPackage.get(up.packageId) ?? 0) + used);
    }

    const data = Array.from(acc.values())
      .map((row) => {
        const usedCount = usedCountByPackage.get(row.packageId) ?? 0;
        const totalAllocated = row.soldCount * (row.times || 0);
        const utilizationRate = totalAllocated > 0 ? (usedCount / totalAllocated) * 100 : 0;
        return {
          id: row.packageId,
          packageId: row.packageId,
          name: row.packageName,
          packageName: row.packageName,
          type: 'package',
          salesCount: row.soldCount,
          soldCount: row.soldCount,
          usedCount,
          revenue: Number(row.revenue.toFixed(2)),
          utilizationRate,
        };
      })
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, limit);

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
