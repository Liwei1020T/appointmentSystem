/**
 * 阶梯式推荐奖励服务
 * 根据推荐人数计算奖励积分，支持徽章系统
 */

import { prisma } from '@/lib/prisma';

// 阶梯式奖励配置
export const REFERRAL_TIERS = [
  { min: 1, max: 5, points: 50, badge: null },
  { min: 6, max: 10, points: 80, badge: 'referral_bronze' },
  { min: 11, max: Infinity, points: 100, badge: 'referral_silver' },
];

// 徽章配置
export const BADGE_CONFIG: Record<string, { name: string; icon: string; description: string }> = {
  referral_bronze: {
    name: '推荐新秀',
    icon: '🥉',
    description: '成功推荐 5 位用户',
  },
  referral_silver: {
    name: '推荐达人',
    icon: '🥈',
    description: '成功推荐 10 位用户',
  },
  referral_gold: {
    name: '推荐大师',
    icon: '🥇',
    description: '成功推荐 25 位用户',
  },
  review_master: {
    name: '评价达人',
    icon: '⭐',
    description: '发布 10 条以上评价',
  },
  vip_customer: {
    name: 'VIP 会员',
    icon: '👑',
    description: 'VIP 会员专属徽章',
  },
  first_order: {
    name: '首单达成',
    icon: '🎉',
    description: '完成首次订单',
  },
};

const DEFAULT_REWARD_POINTS = 50;

function getRewardPoints() {
  const raw = Number(process.env.REFERRAL_REWARD_POINTS || DEFAULT_REWARD_POINTS);
  return Number.isFinite(raw) ? raw : DEFAULT_REWARD_POINTS;
}

/**
 * 获取用户当前推荐数量
 */
export async function getUserReferralCount(userId: string): Promise<number> {
  return prisma.referralLog.count({
    where: { referrerId: userId },
  });
}

/**
 * 根据推荐数量获取当前奖励档位
 */
export function getReferralTier(referralCount: number) {
  for (const tier of REFERRAL_TIERS) {
    if (referralCount >= tier.min && referralCount <= tier.max) {
      return tier;
    }
  }
  return REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
}

/**
 * 计算推荐奖励积分（阶梯式）
 * @param referrerId - 推荐人 ID
 * @returns 本次推荐应获得的积分
 */
export async function calculateReferralReward(referrerId: string): Promise<number> {
  const currentCount = await getUserReferralCount(referrerId);
  const newCount = currentCount + 1;
  const tier = getReferralTier(newCount);
  return tier.points;
}

/**
 * 检查并授予徽章
 */
export async function checkAndAwardBadges(
  userId: string,
  referralCount: number
): Promise<string[]> {
  const newBadges: string[] = [];

  const badgeThresholds = [
    { count: 5, badge: 'referral_bronze' },
    { count: 10, badge: 'referral_silver' },
    { count: 25, badge: 'referral_gold' },
  ];

  for (const threshold of badgeThresholds) {
    if (referralCount >= threshold.count) {
      const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeType: { userId, badgeType: threshold.badge } },
      });

      if (!existing) {
        await prisma.userBadge.create({
          data: { userId, badgeType: threshold.badge },
        });
        newBadges.push(threshold.badge);

        const badgeInfo = BADGE_CONFIG[threshold.badge];
        if (badgeInfo) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'system',
              title: `🏆 获得新徽章：${badgeInfo.name}`,
              message: badgeInfo.description,
              actionUrl: '/profile/badges',
            },
          });
        }
      }
    }
  }

  return newBadges;
}

/**
 * 处理推荐奖励（阶梯式）- 在新用户注册成功后调用
 */
export async function processReferralReward(
  referrerId: string,
  referredId: string,
  referralCode: string,
  referredPhone: string
): Promise<{ referrerPoints: number; referredPoints: number; newBadges: string[] }> {
  const currentCount = await getUserReferralCount(referrerId);
  const newCount = currentCount + 1;

  const tier = getReferralTier(newCount);
  const referrerPoints = tier.points;
  const referredPoints = 50;

  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { points: true },
  });

  if (!referrer) {
    throw new Error('Referrer not found');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referrerId },
      data: { points: { increment: referrerPoints } },
    }),
    prisma.pointsLog.create({
      data: {
        userId: referrerId,
        amount: referrerPoints,
        type: 'referral',
        referenceId: referredId,
        description: `推荐用户 ${referredPhone}（第 ${newCount} 位，${referrerPoints} 积分）`,
        balanceAfter: referrer.points + referrerPoints,
      },
    }),
    prisma.pointsLog.create({
      data: {
        userId: referredId,
        amount: referredPoints,
        type: 'referral',
        description: '注册奖励',
        balanceAfter: referredPoints,
      },
    }),
    prisma.referralLog.create({
      data: {
        referrerId,
        referredId,
        referralCode,
        rewardGiven: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: referrerId,
        type: 'system',
        title: '🎉 邀请奖励',
        message: `成功邀请第 ${newCount} 位用户，获得 ${referrerPoints} 积分！`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: referredId,
        type: 'system',
        title: '🎁 注册奖励',
        message: `注册成功，获得 ${referredPoints} 积分`,
      },
    }),
  ]);

  const newBadges = await checkAndAwardBadges(referrerId, newCount);

  return { referrerPoints, referredPoints, newBadges };
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

  const referralCount = referrals.length;
  const totalRewards = referrals.filter((r) => r.rewardGiven).length;

  // 计算阶梯式总积分（累计各阶段的积分）
  let totalPointsEarned = 0;
  for (let i = 1; i <= referralCount; i++) {
    const tier = getReferralTier(i);
    totalPointsEarned += tier.points;
  }

  const currentTier = getReferralTier(referralCount);
  const nextTier = REFERRAL_TIERS.find((t) => t.min > referralCount);

  return {
    referralCode: user.referralCode,
    referrals,
    stats: {
      totalReferrals: referralCount,
      totalRewards,
      totalPointsEarned,
      currentTier: {
        pointsPerReferral: currentTier.points,
        badge: currentTier.badge,
      },
      nextTier: nextTier
        ? {
            minReferrals: nextTier.min,
            pointsPerReferral: nextTier.points,
            remaining: nextTier.min - referralCount,
          }
        : null,
    },
  };
}

/**
 * Fetch referral stats for the current user in UI-friendly shape.
 */
export async function getMyReferralStats(userId: string) {
  const [user, referrals, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.referralLog.findMany({
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
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    }),
  ]);

  const referralCount = referrals.length;
  const completedRewards = referrals.filter((ref) => ref.rewardGiven).length;
  const pendingRewards = referrals.filter((ref) => !ref.rewardGiven).length;

  // 计算阶梯式总积分
  let totalPoints = 0;
  for (let i = 1; i <= completedRewards; i++) {
    const tier = getReferralTier(i);
    totalPoints += tier.points;
  }

  const currentTier = getReferralTier(referralCount);
  const nextTier = REFERRAL_TIERS.find((t) => t.min > referralCount);

  return {
    referralCode: user?.referralCode ?? null,
    referralCount,
    totalPoints,
    pendingRewards,
    currentTier: {
      pointsPerReferral: currentTier.points,
      badge: currentTier.badge,
      badgeInfo: currentTier.badge ? BADGE_CONFIG[currentTier.badge] : null,
    },
    nextTier: nextTier
      ? {
          minReferrals: nextTier.min,
          pointsPerReferral: nextTier.points,
          badge: nextTier.badge,
          remaining: nextTier.min - referralCount,
        }
      : null,
    referrals: referrals.map((ref, index) => {
      const tier = getReferralTier(index + 1);
      return {
        id: ref.id,
        fullName: ref.referred?.fullName || 'User',
        createdAt: ref.referred?.createdAt || ref.createdAt,
        status: ref.rewardGiven ? 'completed' : 'pending',
        rewardPoints: ref.rewardGiven ? tier.points : 0,
        tierLevel: index + 1,
      };
    }),
    badges: badges.map((b) => ({
      type: b.badgeType,
      earnedAt: b.earnedAt.toISOString(),
      ...(BADGE_CONFIG[b.badgeType] || { name: b.badgeType, icon: '🏅', description: '' }),
    })),
  };
}

/**
 * Build the referral leaderboard (ranked by referral count).
 */
export async function getReferralLeaderboard(limit = 10) {
  const leaderboard = await prisma.referralLog.groupBy({
    by: ['referrerId'],
    _count: { referrerId: true },
    orderBy: { _count: { referrerId: 'desc' } },
    take: limit,
  });

  const userIds = leaderboard.map((r) => r.referrerId);
  if (userIds.length === 0) return [];

  const [users, badges] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, avatarUrl: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, badgeType: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const badgeMap = new Map<string, string[]>();
  badges.forEach((b) => {
    const existing = badgeMap.get(b.userId) || [];
    existing.push(b.badgeType);
    badgeMap.set(b.userId, existing);
  });

  return leaderboard.map((entry, index) => {
    const user = userMap.get(entry.referrerId);
    const userBadges = badgeMap.get(entry.referrerId) || [];
    const tier = getReferralTier(entry._count.referrerId);

    // 计算总积分
    let totalPoints = 0;
    for (let i = 1; i <= entry._count.referrerId; i++) {
      const t = getReferralTier(i);
      totalPoints += t.points;
    }

    return {
      rank: index + 1,
      userId: entry.referrerId,
      name: user?.fullName || '匿名用户',
      avatarUrl: user?.avatarUrl || null,
      referralCount: entry._count.referrerId,
      totalPoints,
      currentTier: tier.badge,
      badges: userBadges.map((b) => ({
        type: b,
        ...(BADGE_CONFIG[b] || { name: b, icon: '🏅' }),
      })),
    };
  });
}

/**
 * 获取用户徽章列表
 */
export async function getUserBadges(userId: string) {
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  });

  return badges.map((b) => ({
    id: b.id,
    type: b.badgeType,
    earnedAt: b.earnedAt.toISOString(),
    ...(BADGE_CONFIG[b.badgeType] || { name: b.badgeType, icon: '🏅', description: '' }),
  }));
}
