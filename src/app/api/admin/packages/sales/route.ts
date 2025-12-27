/**
 * 管理员 - 套餐销售数据
 *
 * GET /api/admin/packages/sales
 *
 * 用途：
 * - 管理后台“套餐管理”页面需要展示每个套餐的销量、收入、活跃用户
 *
 * 统计口径（与现有支付状态保持一致）：
 * - 只统计已确认的套餐支付：payments.packageId != null 且 payments.status in ['success', 'completed']
 * - 销量 = 支付记录数量
 * - 收入 = amount 求和
 * - 活跃用户 = 不重复 userId 数量
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

/**
 * GET /api/admin/packages/sales
 * Query:
 * - startDate?: string (ISO)
 * - endDate?: string (ISO)
 * - packageId?: string
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const packageId = searchParams.get('packageId');

    const confirmedStatuses = ['success', 'completed'] as const;

    // 时间范围筛选（可选）
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) createdAt.lte = new Date(endDate);

    const where = {
      packageId: packageId || { not: null },
      status: { in: confirmedStatuses as unknown as string[] },
      ...(startDate || endDate ? { createdAt } : {}),
    } as const;

    const payments = await prisma.payment.findMany({
      where,
      select: {
        packageId: true,
        userId: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const packageIds = Array.from(
      new Set(payments.map((p) => p.packageId).filter(Boolean) as string[])
    );

    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds } },
      select: { id: true, name: true },
    });
    const packageNameById = new Map(packages.map((p) => [p.id, p.name]));

    // 按 packageId 聚合
    const acc = new Map<
      string,
      {
        totalSold: number;
        totalRevenue: number;
        userIds: Set<string>;
      }
    >();

    for (const payment of payments) {
      const pid = payment.packageId;
      if (!pid) continue;
      const current = acc.get(pid) ?? {
        totalSold: 0,
        totalRevenue: 0,
        userIds: new Set<string>(),
      };
      current.totalSold += 1;
      current.totalRevenue += Number(payment.amount ?? 0);
      current.userIds.add(payment.userId);
      acc.set(pid, current);
    }

    const period =
      startDate || endDate
        ? `${startDate || ''}~${endDate || ''}`.replace(/~$/, '')
        : 'all';

    const data = Array.from(acc.entries()).map(([pid, stats]) => {
      const packageName = packageNameById.get(pid) || '套餐';
      const activeUsers = stats.userIds.size;
      return {
        // snake_case（前端页面直接使用）
        package_id: pid,
        package_name: packageName,
        total_sold: stats.totalSold,
        total_revenue: stats.totalRevenue,
        active_users: activeUsers,
        period,
        // camelCase（服务层/未来复用）
        packageId: pid,
        packageName,
        totalSold: stats.totalSold,
        totalRevenue: stats.totalRevenue,
        activeUsers,
        salesCount: stats.totalSold,
        revenue: stats.totalRevenue,
      };
    });

    // 保持输出稳定：无数据时返回空数组
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
