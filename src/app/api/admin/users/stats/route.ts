/**
 * Admin - User stats API
 * GET /api/admin/users/stats
 *
 * Used by Admin User Management dashboard cards.
 */
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getStartOfWeek(date: Date) {
  const d = getStartOfDay(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  // Week starts Monday (1). Convert Sunday(0) to 7.
  const normalized = day === 0 ? 7 : day;
  d.setDate(d.getDate() - (normalized - 1));
  return d;
}
function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const startOfDay = getStartOfDay(now);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalOrders,
      totalRevenueAgg,
      totalPointsDistributedAgg,
      usersByRoleAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { price: true },
      }),
      prisma.pointsLog.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);
    const totalRevenue = Number(totalRevenueAgg._sum?.price ?? 0);
    const totalPointsDistributed = Number(totalPointsDistributedAgg._sum?.amount ?? 0);
    // Note: "blocked" is not modeled in current schema; keep as 0 for compatibility.
    const blockedUsers = 0;
    const activeUsers = Math.max(0, totalUsers - blockedUsers);
    const usersByRole = usersByRoleAgg.map((row) => ({
      role: row.role,
      count: row._count.role,
    }));
    // Return both camelCase + snake_case aliases to be resilient to mixed UI code.
    return successResponse({
      totalUsers,
      total_users: totalUsers,
      newUsersToday,
      new_users_today: newUsersToday,
      newUsersThisWeek,
      new_users_this_week: newUsersThisWeek,
      newUsersThisMonth,
      new_users_this_month: newUsersThisMonth,
      activeUsers,
      active_users: activeUsers,
      activeUsersToday: activeUsers, // schema has no activity tracking; use totals as a safe fallback
      active_users_today: activeUsers,
      activeUsersThisWeek: activeUsers,
      active_users_this_week: activeUsers,
      blockedUsers,
      blocked_users: blockedUsers,
      totalOrders,
      total_orders: totalOrders,
      totalRevenue,
      total_revenue: totalRevenue,
      totalPointsDistributed,
      total_points_distributed: totalPointsDistributed,
      usersByRole,
      users_by_role: usersByRole,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
