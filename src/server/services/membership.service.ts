/**
 * 会员等级服务
 * 处理会员升级、权益计算等逻辑
 */

import { prisma } from '@/lib/prisma';
import { MembershipTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '@/lib/api-errors';

// 等级规则配置
const TIER_RULES = {
  VIP: {
    minSpent: 500,
    minOrders: 12,
  },
  GOLD: {
    minSpent: 200,
    minOrders: 5,
  },
  SILVER: {
    minSpent: 0,
    minOrders: 0,
  },
};

/**
 * 检查并升级用户会员等级
 * @param userId 用户ID
 * @returns 升级结果
 */
export async function checkAndUpgradeTier(userId: string): Promise<{
  oldTier: MembershipTier;
  newTier: MembershipTier;
  upgraded: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      membershipTier: true,
      totalSpent: true,
      totalOrders: true,
    },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 404, 'User not found');
  }

  // 重新计算统计数据（可选，为确保准确性这里重新计算）
  const stats = await prisma.order.aggregate({
    where: {
      userId: userId,
      status: 'completed', // 仅统计已完成订单
    },
    _sum: {
      price: true, // 使用最终价格
    },
    _count: {
      id: true,
    },
  });

  const totalSpent = stats._sum.price ? Number(stats._sum.price) : 0;
  const totalOrders = stats._count.id;

  // 更新用户统计数据
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalSpent: new Decimal(totalSpent),
      totalOrders: totalOrders,
    },
  });

  // 判断目标等级
  // NOTE: 用户必须同时满足消费金额和订单数量两个条件才能升级
  // 例如：VIP 需要消费 >= 500 RM 且 订单数 >= 12
  let targetTier: MembershipTier = MembershipTier.SILVER;

  if (
    totalSpent >= TIER_RULES.VIP.minSpent &&
    totalOrders >= TIER_RULES.VIP.minOrders
  ) {
    targetTier = MembershipTier.VIP;
  } else if (
    totalSpent >= TIER_RULES.GOLD.minSpent &&
    totalOrders >= TIER_RULES.GOLD.minOrders
  ) {
    targetTier = MembershipTier.GOLD;
  }

  // 如果目标等级高于当前等级，执行升级
  // 等级顺序: SILVER < GOLD < VIP
  const tierLevels = {
    [MembershipTier.SILVER]: 0,
    [MembershipTier.GOLD]: 1,
    [MembershipTier.VIP]: 2,
  };

  const currentLevel = tierLevels[user.membershipTier];
  const targetLevel = tierLevels[targetTier];

  if (targetLevel > currentLevel) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipTier: targetTier,
        tierUpdatedAt: new Date(),
      },
    });

    // 创建升级通知
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'system',
        title: '🎉 会员等级升级',
        message: `恭喜！您的会员等级已升级为 ${targetTier}，享受更多专属权益！`,
        actionUrl: '/profile/membership',
      },
    });

    return {
      oldTier: user.membershipTier,
      newTier: targetTier,
      upgraded: true,
    };
  }

  return {
    oldTier: user.membershipTier,
    newTier: user.membershipTier,
    upgraded: false,
  };
}

/**
 * 获取等级对应的积分倍率
 * @param tier 会员等级
 */
export async function calculatePointsMultiplier(tier: MembershipTier): Promise<number> {
  // 优先从数据库查询配置
  const benefit = await prisma.tierBenefit.findFirst({
    where: {
      tier: tier,
      benefitType: 'points_multiplier',
      isActive: true,
    },
  });

  if (benefit && benefit.benefitValue) {
    return parseFloat(benefit.benefitValue);
  }

  // 默认兜底配置
  switch (tier) {
    case 'VIP':
      return 1.5;
    case 'GOLD':
      return 1.2;
    case 'SILVER':
    default:
      return 1.0;
  }
}

/**
 * 获取会员等级权益列表
 * @param tier 会员等级
 */
export async function getTierBenefits(tier: MembershipTier) {
  return prisma.tierBenefit.findMany({
    where: {
      tier: tier,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * 获取下一等级的进度信息
 */
export async function getNextTierProgress(
  currentTier: MembershipTier,
  totalSpent: number,
  totalOrders: number
): Promise<{
  nextTier: MembershipTier | null;
  spentProgress: number;
  ordersProgress: number;
  spentTarget: number;
  ordersTarget: number;
}> {
  if (currentTier === MembershipTier.VIP) {
    return {
      nextTier: null,
      spentProgress: 100,
      ordersProgress: 100,
      spentTarget: 0,
      ordersTarget: 0,
    };
  }

  let nextTier: MembershipTier;
  let targetRule;

  if (currentTier === MembershipTier.SILVER) {
    nextTier = MembershipTier.GOLD;
    targetRule = TIER_RULES.GOLD;
  } else {
    nextTier = MembershipTier.VIP;
    targetRule = TIER_RULES.VIP;
  }

  const spentProgress = Math.min(100, (totalSpent / targetRule.minSpent) * 100);
  const ordersProgress = Math.min(100, (totalOrders / targetRule.minOrders) * 100);

  return {
    nextTier,
    spentProgress,
    ordersProgress,
    spentTarget: targetRule.minSpent,
    ordersTarget: targetRule.minOrders,
  };
}
