import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * GET /api/admin/packages/stats
 * 返回套餐统计信息（可用为空数据，避免前端解析报错）
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();

    const totalPackages = await prisma.package.count();
    const activePackages = await prisma.package.count({ where: { active: true } });

    return successResponse({
      totalPackages,
      total_packages: totalPackages,
      activePackages,
      active_packages: activePackages,
      totalSales: 0,
      total_sales: 0,
      totalRevenue: 0,
      total_revenue: 0,
      totalPurchases: 0,
      total_purchases: 0,
      thisMonthPurchases: 0,
      this_month_purchases: 0,
      thisMonthRevenue: 0,
      this_month_revenue: 0,
      mostPopularPackage: null,
      most_popular_package: null,
    });
  } catch (error: any) {
    console.error('Get package stats error:', error);
    return errorResponse(error.message || '获取套餐统计失败', 500);
  }
}
