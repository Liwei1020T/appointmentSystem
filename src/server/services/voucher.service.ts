import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return Number(value);
}

/**
 * Fetch user vouchers with voucher metadata.
 */
export async function getUserVouchers(userId: string, status?: string) {
  return prisma.userVoucher.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: { voucher: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Map user vouchers into legacy UI payload shape.
 */
export async function getUserVouchersMapped(userId: string, status?: string) {
  const vouchers = await getUserVouchers(userId, status);

  return vouchers.map((uv) => {
    const voucher = uv.voucher;
    const type = (voucher.type || '').toLowerCase();
    const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
    const discountValue = toNumber(voucher.value);
    const minPurchase = toNumber(voucher.minPurchase || 0);

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
        min_purchase: minPurchase,
        max_discount: null,
        description: null,
      },
    };
  });
}

/**
 * Redeem a voucher by code, optionally using points.
 */
export async function redeemVoucherByCode(userId: string, code: string, usePoints = false) {
  const trimmed = code?.trim();
  if (!trimmed) {
    throw new ApiError('BAD_REQUEST', 400, 'Voucher code is required');
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: trimmed.toUpperCase() },
  });

  if (!voucher) {
    throw new ApiError('NOT_FOUND', 404, 'Voucher not found');
  }

  if (!voucher.active) {
    throw new ApiError('CONFLICT', 409, 'Voucher is inactive');
  }

  const now = new Date();
  if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
    throw new ApiError('CONFLICT', 409, 'Voucher not in valid date range');
  }

  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    throw new ApiError('CONFLICT', 409, 'Voucher is fully redeemed');
  }

  const existingCount = await prisma.userVoucher.count({
    where: { userId, voucherId: voucher.id },
  });

  const maxPerUser = voucher.maxRedemptionsPerUser || 1;
  if (existingCount >= maxPerUser) {
    throw new ApiError('CONFLICT', 409, 'Voucher redemption limit reached');
  }

  if (usePoints && voucher.pointsCost > 0) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!currentUser || currentUser.points < voucher.pointsCost) {
      throw new ApiError('CONFLICT', 409, 'Insufficient points');
    }

    await prisma.$transaction(async (tx) => {
      const newBalance = currentUser.points - voucher.pointsCost;
      await tx.user.update({
        where: { id: userId },
        data: { points: newBalance },
      });

      await tx.pointsLog.create({
        data: {
          userId,
          amount: -voucher.pointsCost,
          type: 'redeem',
          referenceId: voucher.id,
          description: `Redeem voucher: ${voucher.name}`,
          balanceAfter: newBalance,
        },
      });

      const expiryDate = new Date(voucher.validUntil);
      await tx.userVoucher.create({
        data: {
          userId,
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
          userId,
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
 * Fetch redeemable vouchers for the current user.
 */
export async function getRedeemableVouchers(userId: string) {
  const now = new Date();

  const ownedVouchers = await prisma.userVoucher.groupBy({
    by: ['voucherId'],
    where: { userId },
    _count: { voucherId: true },
  });
  const ownedCountMap = new Map(
    ownedVouchers.map((r) => [r.voucherId, r._count.voucherId])
  );

  const vouchers = await prisma.voucher.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  return vouchers
    .map((voucher) => {
      const ownedCount = ownedCountMap.get(voucher.id) || 0;
      const maxPerUser = voucher.maxRedemptionsPerUser || 1;
      const remainingRedemptions = Math.max(0, maxPerUser - ownedCount);

      if (remainingRedemptions <= 0) return null;

      const type = (voucher.type || '').toLowerCase();
      const discountType = type.includes('percentage') ? 'percentage' : 'fixed';
      const discountValue = toNumber(voucher.value);

      return {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase: toNumber(voucher.minPurchase || 0),
        max_discount: null,
        points_cost: voucher.pointsCost,
        points_required: voucher.pointsCost,
        valid_from: voucher.validFrom.toISOString(),
        valid_until: voucher.validUntil.toISOString(),
        active: voucher.active,
        owned_count: ownedCount,
        max_per_user: maxPerUser,
        can_redeem: remainingRedemptions > 0,
        remaining_redemptions: remainingRedemptions,
        max_redemptions_per_user: maxPerUser,
      };
    })
    .filter(Boolean);
}

/**
 * Redeem a voucher using points.
 */
export async function redeemVoucherWithPoints(userId: string, voucherId: string, points?: number) {
  if (!voucherId) {
    throw new ApiError('BAD_REQUEST', 400, 'Voucher id is required');
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
  });

  if (!voucher) {
    throw new ApiError('NOT_FOUND', 404, 'Voucher not found');
  }

  if (!voucher.active) {
    throw new ApiError('CONFLICT', 409, 'Voucher is inactive');
  }

  const now = new Date();
  if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
    throw new ApiError('CONFLICT', 409, 'Voucher not in valid date range');
  }

  if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
    throw new ApiError('CONFLICT', 409, 'Voucher is fully redeemed');
  }

  const existingCount = await prisma.userVoucher.count({
    where: { userId, voucherId: voucher.id },
  });

  const maxPerUser = voucher.maxRedemptionsPerUser || 1;
  if (existingCount >= maxPerUser) {
    throw new ApiError('CONFLICT', 409, 'Voucher redemption limit reached');
  }

  const requiredPoints = voucher.pointsCost || 0;
  const pointsToUse = Number.isFinite(Number(points)) ? Number(points) : requiredPoints;

  if (requiredPoints > 0 && pointsToUse < requiredPoints) {
    throw new ApiError('CONFLICT', 409, 'Insufficient points');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!currentUser || currentUser.points < requiredPoints) {
    throw new ApiError('CONFLICT', 409, 'Insufficient points');
  }

  return prisma.$transaction(async (tx) => {
    const newBalance = currentUser.points - requiredPoints;
    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    await tx.pointsLog.create({
      data: {
        userId,
        amount: -requiredPoints,
        type: 'redeem',
        referenceId: voucher.id,
        description: `Redeem voucher: ${voucher.name}`,
        balanceAfter: newBalance,
      },
    });

    const expiryDate = new Date(voucher.validUntil);
    const userVoucher = await tx.userVoucher.create({
      data: {
        userId,
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
}

/**
 * Aggregate voucher stats for the user.
 */
export async function getVoucherStats(userId: string) {
  const now = new Date();

  const [total, used, active] = await Promise.all([
    prisma.userVoucher.count({ where: { userId } }),
    prisma.userVoucher.count({ where: { userId, status: 'used' } }),
    prisma.userVoucher.count({
      where: { userId, status: 'active', expiry: { gt: now } },
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
