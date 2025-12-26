import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';

interface PointsHistoryOptions {
  type?: string;
  limit?: number;
}

/**
 * Fetch the user's points balance and logs.
 */
export async function getPointsSummary(userId: string, options?: PointsHistoryOptions) {
  const limit = options?.limit ? Number(options.limit) : undefined;
  const type = options?.type?.trim();

  const [logs, user] = await Promise.all([
    prisma.pointsLog.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    }),
  ]);

  return {
    balance: user?.points ?? 0,
    logs,
  };
}

/**
 * Fetch points logs only.
 */
export async function getPointsHistory(userId: string, options?: PointsHistoryOptions) {
  const limit = options?.limit ? Number(options.limit) : undefined;
  const type = options?.type?.trim();

  return prisma.pointsLog.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });
}

/**
 * Aggregate points stats for the current user.
 */
export async function getPointsStats(userId: string) {
  const logs = await prisma.pointsLog.findMany({
    where: { userId },
    select: { amount: true, createdAt: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalEarned = 0;
  let totalSpent = 0;
  let earnedThisMonth = 0;
  let spentThisMonth = 0;

  logs.forEach((log) => {
    const amount = Number(log.amount) || 0;
    if (amount > 0) {
      totalEarned += amount;
      if (log.createdAt >= startOfMonth) earnedThisMonth += amount;
    } else if (amount < 0) {
      totalSpent += Math.abs(amount);
      if (log.createdAt >= startOfMonth) spentThisMonth += Math.abs(amount);
    }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  return {
    totalPoints: user?.points ?? 0,
    earnedThisMonth,
    redeemedThisMonth: spentThisMonth,
    total_earned: totalEarned,
    total_spent: totalSpent,
  };
}

/**
 * Redeem points from the current user's balance.
 */
export async function redeemPoints(userId: string, points: number, reason?: string) {
  const normalized = Number(points);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid points amount');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new ApiError('NOT_FOUND', 404, 'User not found');
    }

    if (user.points < normalized) {
      throw new ApiError('CONFLICT', 409, 'Insufficient points balance');
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: normalized } },
      select: { points: true },
    });

    await tx.pointsLog.create({
      data: {
        userId,
        amount: -normalized,
        type: 'redeem',
        description: reason || 'Points redemption',
        balanceAfter: updated.points,
      },
    });

    return { balance: updated.points, redeemed: normalized };
  });
}
