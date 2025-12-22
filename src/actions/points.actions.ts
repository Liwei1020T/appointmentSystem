'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

/**
 * 获取积分余额 + 明细（Server Action）
 */
export async function getPointsAction(options?: { limit?: number }) {
  const user = await requireAuth();
  const limit = options?.limit;

  const pointsLogs = await prisma.pointsLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { points: true },
  });

  return {
    balance: currentUser?.points || 0,
    logs: pointsLogs,
  };
}

/**
 * 获取积分历史记录（Server Action）
 */
export async function getPointsHistoryAction(options?: { type?: string; limit?: number }) {
  const user = await requireAuth();
  const type = options?.type;
  const limit = options?.limit;

  const logs = await prisma.pointsLog.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });

  return { logs };
}

/**
 * 获取积分统计（Server Action）
 */
export async function getPointsStatsAction() {
  const user = await requireAuth();

  const logs = await prisma.pointsLog.findMany({
    where: { userId: user.id },
    select: { amount: true, type: true },
  });

  let totalEarned = 0;
  let totalSpent = 0;
  logs.forEach((log) => {
    const amount = Number(log.amount) || 0;
    if (amount > 0) {
      totalEarned += amount;
    } else if (amount < 0) {
      totalSpent += Math.abs(amount);
    }
  });

  return {
    total_earned: totalEarned,
    total_spent: totalSpent,
  };
}
