import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { buildDayKeys, parseDateRangeFromSearchParams, toDayKey } from '@/lib/reporting';
import { handleApiError } from '@/lib/api/handleApiError';

/**
 * 管理员 - 用户增长统计
 *
 * GET /api/admin/reports/user-growth
 * Query:
 * - days?: number（与前端默认调用兼容）
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 说明：
 * - activeUsers：在区间内有下单行为的用户（orders.userId 去重）
 * - usersBySource：按是否有 referredBy 简单拆分（direct/referral）
 * - churnRate：当前未实现用户流失定义，返回 0
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { start, end } = parseDateRangeFromSearchParams(request.nextUrl.searchParams, {
      defaultDays: 30,
    });

    const [totalUsers, newUsersRecords, activeUserIds, referralNewUsers, directNewUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.order.findMany({
          where: { createdAt: { gte: start, lte: end } },
          distinct: ['userId'],
          select: { userId: true },
        }),
        prisma.user.count({
          where: { createdAt: { gte: start, lte: end }, referredBy: { not: null } },
        }),
        prisma.user.count({
          where: { createdAt: { gte: start, lte: end }, referredBy: null },
        }),
      ]);

    const newUsers = newUsersRecords.length;
    const activeUsers = activeUserIds.length;

    // daily growth
    const dayKeys = buildDayKeys(start, end);
    const newUsersByDay = new Map<string, number>();
    for (const u of newUsersRecords) {
      const key = toDayKey(u.createdAt);
      newUsersByDay.set(key, (newUsersByDay.get(key) ?? 0) + 1);
    }

    // 区间起始时的累计用户数（近似）：当前总用户 - 区间内新增
    const baseUsers = Math.max(totalUsers - newUsers, 0);
    let cumulative = baseUsers;

    const dailyGrowth = dayKeys.map((date) => {
      const inc = newUsersByDay.get(date) ?? 0;
      cumulative += inc;
      return {
        date,
        newUsers: inc,
        cumulativeUsers: cumulative,
      };
    });

    const usersBySourceTotal = referralNewUsers + directNewUsers;
    const usersBySource = [
      {
        source: 'direct',
        count: directNewUsers,
        percentage: usersBySourceTotal > 0 ? (directNewUsers / usersBySourceTotal) * 100 : 0,
      },
      {
        source: 'referral',
        count: referralNewUsers,
        percentage: usersBySourceTotal > 0 ? (referralNewUsers / usersBySourceTotal) * 100 : 0,
      },
    ];

    // growthRate：与前一同长度周期的新增用户对比
    const days = dayKeys.length;
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);
    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - days);
    const prevNewUsers = await prisma.user.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd } },
    });
    const growthRate = prevNewUsers > 0 ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 : 0;

    return successResponse({
      totalUsers,
      newUsers,
      activeUsers,
      churnRate: 0,
      growthRate,
      growthByDay: dailyGrowth.map((d) => ({
        date: d.date,
        newUsers: d.newUsers,
        totalUsers: d.cumulativeUsers,
      })),
      dailyGrowth,
      usersBySource,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

