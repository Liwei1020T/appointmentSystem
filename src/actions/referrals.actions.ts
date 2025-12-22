'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

/**
 * 获取推荐记录（Server Action）
 */
export async function getReferralsAction() {
  const user = await requireAuth();

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
  const rewardPoints = parseInt(process.env.REFERRAL_REWARD_POINTS || '50', 10);

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
