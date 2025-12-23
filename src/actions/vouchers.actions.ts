'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

/**
 * 获取用户优惠券（Server Action）
 */
export async function getUserVouchersAction(status?: string) {
  const user = await requireAuth();

  const userVouchers = await prisma.userVoucher.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: { voucher: true },
    orderBy: { createdAt: 'desc' },
  });

  return userVouchers;
}

/**
 * 获取用户优惠券（UI 兼容字段）
 */
export async function getUserVouchersMappedAction(status?: string) {
  const user = await requireAuth();

  const userVouchers = await prisma.userVoucher.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: { voucher: true },
    orderBy: { createdAt: 'desc' },
  });

  return userVouchers.map((uv) => {
    const voucher = uv.voucher;
    const type = (voucher.type || '').toLowerCase();
    const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
    const discountValue = typeof voucher.value === 'object'
      ? voucher.value.toNumber()
      : Number(voucher.value);

    return {
      id: uv.id,
      user_id: uv.userId,
      voucher_id: uv.voucherId,
      status: uv.status,
      used_at: uv.usedAt ? uv.usedAt.toISOString() : null,
      order_id: uv.orderId,
      expiry: uv.expiry.toISOString(),
      created_at: uv.createdAt.toISOString(),
      used: uv.status === 'used',
      expires_at: uv.expiry.toISOString(),
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase: typeof voucher.minPurchase === 'object'
          ? voucher.minPurchase.toNumber()
          : Number(voucher.minPurchase || 0),
        max_discount: null,
        description: null,
      },
    };
  });
}

/**
 * 兑换优惠券（按 code）
 */
export async function redeemVoucherAction(params: { code: string; usePoints?: boolean }) {
  const user = await requireAuth();
  const code = params.code;
  const usePoints = Boolean(params.usePoints);

  if (!code) {
    throw new Error('请输入优惠券代码');
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!voucher) {
    throw new Error('优惠券不存在');
  }

  if (!voucher.active) {
    throw new Error('优惠券已失效');
  }

  const now = new Date();
  if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
    throw new Error('优惠券不在有效期内');
  }

  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    throw new Error('优惠券已被领完');
  }

  // 检查每用户兑换次数上限
  const existingCount = await prisma.userVoucher.count({
    where: { userId: user.id, voucherId: voucher.id },
  });

  const maxPerUser = (voucher as any).maxRedemptionsPerUser ?? 1;
  if (existingCount >= maxPerUser) {
    throw new Error(`此优惠券每人最多兑换 ${maxPerUser} 张，您已达到上限`);
  }

  if (usePoints && voucher.pointsCost > 0) {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true },
    });

    if (!currentUser || currentUser.points < voucher.pointsCost) {
      throw new Error(`积分不足，需要 ${voucher.pointsCost} 积分`);
    }

    await prisma.$transaction(async (tx) => {
      const newBalance = currentUser.points - voucher.pointsCost;
      await tx.user.update({
        where: { id: user.id },
        data: { points: newBalance },
      });

      await tx.pointsLog.create({
        data: {
          userId: user.id,
          amount: -voucher.pointsCost,
          type: 'redeem',
          referenceId: voucher.id,
          description: `兑换优惠券: ${voucher.name}`,
          balanceAfter: newBalance,
        },
      });

      const expiryDate = new Date(voucher.validUntil);
      await tx.userVoucher.create({
        data: {
          userId: user.id,
          voucherId: voucher.id,
          status: 'active',
          expiry: expiryDate,
        },
      });

      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const expiryDate = new Date(voucher.validUntil);
      await tx.userVoucher.create({
        data: {
          userId: user.id,
          voucherId: voucher.id,
          status: 'active',
          expiry: expiryDate,
        },
      });

      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    });
  }

  return { voucherName: voucher.name };
}

/**
 * 获取可兑换优惠券（Server Action）
 */
export async function getRedeemableVouchersAction() {
  const user = await requireAuth();
  const now = new Date();

  // 获取用户已拥有的优惠券及数量
  const ownedCounts = await prisma.userVoucher.groupBy({
    by: ['voucherId'],
    where: { userId: user.id },
    _count: { voucherId: true },
  });
  const ownedCountMap = new Map(ownedCounts.map(o => [o.voucherId, o._count.voucherId]));

  // 获取所有有效优惠券
  const allVouchers = await prisma.voucher.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 过滤：只保留未达到每用户兑换上限的优惠券
  const vouchers = allVouchers.filter(voucher => {
    const ownedCount = ownedCountMap.get(voucher.id) || 0;
    const maxPerUser = (voucher as any).maxRedemptionsPerUser ?? 1;
    return ownedCount < maxPerUser;
  });

  return vouchers.map((voucher) => {
    const type = (voucher.type || '').toLowerCase();
    const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
    const discountValue = typeof voucher.value === 'object'
      ? voucher.value.toNumber()
      : Number(voucher.value);

    const ownedCount = ownedCountMap.get(voucher.id) || 0;
    const maxPerUser = (voucher as any).maxRedemptionsPerUser ?? 1;

    return {
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discount_type: discountType,
      discount_value: discountValue,
      min_purchase: typeof voucher.minPurchase === 'object'
        ? voucher.minPurchase.toNumber()
        : Number(voucher.minPurchase || 0),
      max_discount: null,
      points_cost: voucher.pointsCost,
      points_required: voucher.pointsCost,
      valid_from: voucher.validFrom.toISOString(),
      valid_until: voucher.validUntil.toISOString(),
      active: voucher.active,
      // 新增：显示剩余可兑换次数
      max_redemptions_per_user: maxPerUser,
      remaining_redemptions: maxPerUser - ownedCount,
    };
  });
}

/**
 * 使用积分兑换优惠券（Server Action）
 */
export async function redeemVoucherWithPointsAction(params: { voucherId: string; points?: number }) {
  const user = await requireAuth();
  const voucherId = params.voucherId;

  if (!voucherId) {
    throw new Error('缺少优惠券ID');
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
  });

  if (!voucher) {
    throw new Error('优惠券不存在');
  }

  if (!voucher.active) {
    throw new Error('优惠券已失效');
  }

  const now = new Date();
  if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
    throw new Error('优惠券不在有效期内');
  }

  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    throw new Error('优惠券已被领完');
  }

  // 检查每用户兑换次数上限
  const existingCount = await prisma.userVoucher.count({
    where: { userId: user.id, voucherId: voucher.id },
  });

  const maxPerUser = (voucher as any).maxRedemptionsPerUser ?? 1;
  if (existingCount >= maxPerUser) {
    throw new Error(`此优惠券每人最多兑换 ${maxPerUser} 张，您已达到上限`);
  }

  const requiredPoints = voucher.pointsCost || 0;
  const pointsToUse = Number.isFinite(Number(params.points)) ? Number(params.points) : requiredPoints;

  if (requiredPoints > 0 && pointsToUse < requiredPoints) {
    throw new Error(`积分不足，需要 ${requiredPoints} 积分`);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { points: true },
  });

  if (!currentUser || currentUser.points < requiredPoints) {
    throw new Error(`积分不足，需要 ${requiredPoints} 积分`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const newBalance = currentUser.points - requiredPoints;
    await tx.user.update({
      where: { id: user.id },
      data: { points: newBalance },
    });

    await tx.pointsLog.create({
      data: {
        userId: user.id,
        amount: -requiredPoints,
        type: 'redeem',
        referenceId: voucher.id,
        description: `兑换优惠券: ${voucher.name}`,
        balanceAfter: newBalance,
      },
    });

    const expiryDate = new Date(voucher.validUntil);
    const userVoucher = await tx.userVoucher.create({
      data: {
        userId: user.id,
        voucherId: voucher.id,
        status: 'active',
        expiry: expiryDate,
      },
    });

    await tx.voucher.update({
      where: { id: voucher.id },
      data: { usedCount: { increment: 1 } },
    });

    return { userVoucher, balance: newBalance };
  });

  return result;
}

/**
 * 用户优惠券统计（Server Action）
 */
export async function getVoucherStatsAction() {
  const user = await requireAuth();
  const now = new Date();

  const [total, used, active] = await Promise.all([
    prisma.userVoucher.count({ where: { userId: user.id } }),
    prisma.userVoucher.count({ where: { userId: user.id, status: 'used' } }),
    prisma.userVoucher.count({
      where: { userId: user.id, status: 'active', expiry: { gt: now } },
    }),
  ]);

  const expired = total - used - active;
  const usageRate = total > 0 ? Math.round((used / total) * 100) : 0;

  return {
    total,
    used,
    expired: Math.max(expired, 0),
    active,
    available: active,
    usageRate,
    totalVouchers: total,
    usedVouchers: used,
    expiredVouchers: Math.max(expired, 0),
    activeVouchers: active,
  };
}
