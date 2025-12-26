import { prisma } from '@/lib/prisma';

const DEFAULT_REWARD_POINTS = 50;

function getRewardPoints() {
  const raw = Number(process.env.REFERRAL_REWARD_POINTS || DEFAULT_REWARD_POINTS);
  return Number.isFinite(raw) ? raw : DEFAULT_REWARD_POINTS;
}

/**
 * Fetch referral logs and summary for the current user.
 */
export async function getReferralsSummary(user: { id: string; referralCode?: string | null }) {
  const referrals = await prisma.referralLog.findMany({
    where: { referrerId: user.id },
    include: {
      referred: {
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalReferrals = referrals.length;
  const totalRewards = referrals.filter((r) => r.rewardGiven).length;
  const rewardPoints = getRewardPoints();

  return {
    referralCode: user.referralCode,
    referrals,
    stats: {
      totalReferrals,
      totalRewards,
      totalPointsEarned: totalRewards * rewardPoints,
    },
  };
}

/**
 * Fetch referral stats for the current user in UI-friendly shape.
 */
export async function getMyReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  const referrals = await prisma.referralLog.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        select: {
          id: true,
          fullName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rewardPoints = getRewardPoints();
  const referralCount = referrals.length;
  const completedRewards = referrals.filter((ref) => ref.rewardGiven).length;
  const pendingRewards = referrals.filter((ref) => !ref.rewardGiven).length;

  return {
    referralCode: user?.referralCode ?? null,
    referralCount,
    totalPoints: completedRewards * rewardPoints,
    pendingRewards,
    referrals: referrals.map((ref) => ({
      id: ref.id,
      fullName: ref.referred?.fullName || 'User',
      createdAt: ref.referred?.createdAt || ref.createdAt,
      status: ref.rewardGiven ? 'completed' : 'pending',
      rewardPoints: ref.rewardGiven ? rewardPoints : 0,
    })),
  };
}

/**
 * Build the referral leaderboard (ranked by referral count).
 */
export async function getReferralLeaderboard(limit = 10) {
  const logs = await prisma.referralLog.findMany({
    select: { referrerId: true, rewardGiven: true },
  });

  const rewardPoints = getRewardPoints();
  const map = new Map<string, { referralCount: number; rewardCount: number }>();

  logs.forEach((log) => {
    const entry = map.get(log.referrerId) || { referralCount: 0, rewardCount: 0 };
    entry.referralCount += 1;
    if (log.rewardGiven) entry.rewardCount += 1;
    map.set(log.referrerId, entry);
  });

  const referrerIds = Array.from(map.keys());
  if (referrerIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, fullName: true },
  });

  const nameMap = new Map(users.map((user) => [user.id, user.fullName || 'Anonymous']));

  return Array.from(map.entries())
    .map(([userId, stats]) => ({
      userId,
      fullName: nameMap.get(userId) || 'Anonymous',
      referralCount: stats.referralCount,
      totalPoints: stats.rewardCount * rewardPoints,
    }))
    .sort((a, b) => {
      if (b.referralCount !== a.referralCount) return b.referralCount - a.referralCount;
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, limit);
}
