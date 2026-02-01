/**
 * Cron 任务状态汇总 API
 * GET /api/admin/cron/status - 获取所有 cron 任务状态概览
 */

import { requireAdmin } from '@/lib/server-auth';
import { successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface CronTaskStatus {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  stats: Record<string, unknown>;
}

export async function GET() {
  try {
    // 使用标准的 requireAdmin() 认证模式
    await requireAdmin();

    // 获取各项统计数据
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 订单自动化统计
    const [
      pendingOrdersCount,
      ordersUpdatedLast24h,
      expiringPackagesCount,
      expiredPendingOrdersCount,
    ] = await Promise.all([
      // 待处理订单数
      prisma.order.count({
        where: { status: 'pending' },
      }),
      // 过去24小时更新的订单
      prisma.order.count({
        where: {
          updatedAt: { gte: oneDayAgo },
        },
      }),
      // 7天内到期的套餐数
      prisma.userPackage.count({
        where: {
          status: 'active',
          remaining: { gt: 0 },
          expiry: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
      }),
      // 超时未支付订单数（超过1小时）
      prisma.order.count({
        where: {
          status: 'pending',
          createdAt: { lt: oneHourAgo },
        },
      }),
    ]);

    const tasks: CronTaskStatus[] = [
      {
        id: 'order-automation',
        name: '订单自动化',
        description: '自动更新订单状态（pending → confirmed → processing → ready）',
        endpoint: '/api/admin/cron/order-automation',
        stats: {
          pendingOrders: pendingOrdersCount,
          updatedLast24h: ordersUpdatedLast24h,
        },
      },
      {
        id: 'package-renewal',
        name: '套餐续费提醒',
        description: '提醒用户7天内即将到期的套餐',
        endpoint: '/api/admin/cron/package-renewal',
        stats: {
          expiringPackages: expiringPackagesCount,
        },
      },
      {
        id: 'cleanup-orders',
        name: '清理超时订单',
        description: '自动取消超过1小时未支付的订单，释放库存',
        endpoint: '/api/cron/cleanup-orders',
        stats: {
          expiredPendingOrders: expiredPendingOrdersCount,
        },
      },
    ];

    return successResponse({
      tasks,
      lastChecked: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
