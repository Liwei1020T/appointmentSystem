import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import type { Prisma } from '@prisma/client';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/packages/stats
 *
 * 用途：
 * - 管理后台“套餐管理”顶部统计卡（总套餐数/总销售量/总收入/最受欢迎）
 *
 * 统计口径（与现有支付状态保持一致）：
 * - 只统计已确认的套餐支付：payments.packageId != null 且 payments.status in ['success', 'completed']
 * - 总销售量/总购买数：支付记录数量
 * - 总收入：amount 求和
 * - 本月：createdAt 落在当月区间
 * - 最受欢迎：按支付记录数量最多的 packageId
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();

    const totalPackages = await prisma.package.count();
    const activePackages = await prisma.package.count({ where: { active: true } });

    const confirmedStatuses: string[] = ['success', 'completed'];
    const paymentsWhere: Prisma.PaymentWhereInput = {
      packageId: { not: null },
      status: { in: confirmedStatuses },
    };

    // 本月时间范围（本地时区）
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [allAgg, monthAgg, mostPopular] = await Promise.all([
      prisma.payment.aggregate({
        where: paymentsWhere,
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          ...paymentsWhere,
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['packageId'],
        where: paymentsWhere,
        // 使用 id 作为计数口径（每条支付记录都有 id）
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
    ]);

    const totalPurchases = allAgg._count.id ?? 0;
    const totalRevenue = Number(allAgg._sum.amount ?? 0);
    const thisMonthPurchases = monthAgg._count.id ?? 0;
    const thisMonthRevenue = Number(monthAgg._sum.amount ?? 0);

    const mostPopularRow = mostPopular[0];
    const mostPopularPackageId = (mostPopularRow?.packageId as string | null) ?? null;
    const mostPopularPackage = mostPopularPackageId
      ? await prisma.package.findUnique({
          where: { id: mostPopularPackageId },
          select: { name: true },
        })
      : null;

    const mostPopularName = mostPopularPackage?.name ?? null;
    const mostPopularCount = mostPopularRow?._count.id ?? 0;

    return successResponse({
      // camelCase
      totalPackages,
      activePackages,
      totalSales: totalPurchases,
      totalRevenue,
      totalPurchases,
      thisMonthPurchases,
      thisMonthRevenue,
      mostPopularPackage: mostPopularName
        ? { name: mostPopularName, purchaseCount: mostPopularCount }
        : null,
      // snake_case（前端页面直接使用）
      total_packages: totalPackages,
      active_packages: activePackages,
      total_sales: totalPurchases,
      total_revenue: totalRevenue,
      total_purchases: totalPurchases,
      this_month_purchases: thisMonthPurchases,
      this_month_revenue: thisMonthRevenue,
      most_popular_package: mostPopularName
        ? { name: mostPopularName, purchase_count: mostPopularCount }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
