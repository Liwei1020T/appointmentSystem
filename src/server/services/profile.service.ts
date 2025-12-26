import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { validatePassword } from '@/lib/utils';
import {
  getTierForSpend,
  getTierProgress,
  getNextTierAfterSpend,
} from '@/lib/membership';

export interface UpdateProfileInput {
  fullName?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

/**
 * Fetch the authenticated user's profile plus stats.
 */
export async function getUserProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      avatarUrl: true,
      points: true,
      referralCode: true,
      referredBy: true,
      role: true,
      createdAt: true,
    },
  });

  if (!profile) {
    throw new ApiError('NOT_FOUND', 404, 'User not found');
  }

  const [orderCount, packageCount, voucherCount] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.userPackage.count({ where: { userId, status: 'active' } }),
    prisma.userVoucher.count({ where: { userId, status: 'active' } }),
  ]);

  return {
    ...profile,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    stats: {
      totalOrders: orderCount,
      activePackages: packageCount,
      activeVouchers: voucherCount,
    },
  };
}

/**
 * Update the authenticated user's profile fields.
 */
export async function updateUserProfile(userId: string, payload: UpdateProfileInput) {
  const resolvedFullName = payload.fullName ?? payload.full_name;
  const resolvedAvatarUrl = payload.avatarUrl ?? payload.avatar_url;
  const updateData: Record<string, unknown> = {};

  if (resolvedFullName !== undefined) updateData.fullName = resolvedFullName;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (resolvedAvatarUrl !== undefined) updateData.avatarUrl = resolvedAvatarUrl;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      avatarUrl: true,
      points: true,
      referralCode: true,
      referredBy: true,
      role: true,
      createdAt: true,
    },
  });

  const [orderCount, packageCount, voucherCount] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.userPackage.count({ where: { userId, status: 'active' } }),
    prisma.userVoucher.count({ where: { userId, status: 'active' } }),
  ]);

  return {
    ...updatedUser,
    full_name: updatedUser.fullName,
    avatar_url: updatedUser.avatarUrl,
    stats: {
      totalOrders: orderCount,
      activePackages: packageCount,
      activeVouchers: voucherCount,
    },
  };
}

/**
 * Fetch user-level dashboard stats, including membership tier progress.
 */
export async function getUserStats(userId: string) {
  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    activePackages,
    totalPackageCount,
    availableVouchers,
    userProfile,
    totalSpentResult,
  ] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.count({ where: { userId, status: 'pending' } }),
    prisma.order.count({ where: { userId, status: 'completed' } }),
    prisma.userPackage.count({
      where: {
        userId,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
    }),
    prisma.userPackage.aggregate({
      where: {
        userId,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
      _sum: { remaining: true },
    }),
    prisma.userVoucher.count({
      where: {
        userId,
        status: 'active',
        expiry: { gt: new Date() },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { notIn: ['cancelled', 'payment_rejected'] },
      },
      _sum: { price: true },
    }),
  ]);

  const totalSpent = Number(totalSpentResult._sum.price ?? 0);
  const membershipTier = getTierForSpend(totalSpent);
  const nextTier = getNextTierAfterSpend(totalSpent);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    activePackages,
    remainingPackageCount: totalPackageCount._sum.remaining || 0,
    availableVouchers,
    points: userProfile?.points || 0,
    totalSpent,
    membership: {
      tier: membershipTier.id,
      label: membershipTier.label,
      description: membershipTier.description,
      discountRate: membershipTier.discountRate,
      progress: getTierProgress(totalSpent),
      nextTier: nextTier
        ? {
            id: nextTier.id,
            label: nextTier.label,
            minSpend: nextTier.minSpend,
          }
        : null,
    },
  };
}

/**
 * Update the user's password using the credentials flow.
 */
export async function changePassword(userId: string, params: { currentPassword?: string; newPassword: string }) {
  const currentPassword = params.currentPassword ? String(params.currentPassword) : '';
  const newPassword = String(params.newPassword || '');

  if (!newPassword.trim()) {
    throw new ApiError('BAD_REQUEST', 400, 'New password is required');
  }
  if (!validatePassword(newPassword)) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Password does not meet requirements');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (dbUser?.password) {
    if (!currentPassword.trim()) {
      throw new ApiError('BAD_REQUEST', 400, 'Current password is required');
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.password);
    if (!ok) {
      throw new ApiError('FORBIDDEN', 403, 'Current password is incorrect');
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { ok: true };
}

/**
 * Generate or repair the user's referral code.
 */
export async function generateReferralCode(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  const currentCode = (existing?.referralCode || '').trim();
  if (currentCode && /^[0-9]{6}$/.test(currentCode)) {
    return { code: currentCode };
  }

  const oldCode = currentCode || null;

  const createReferralCode6Digits = () => {
    const n = Math.floor(Math.random() * 1_000_000);
    return String(n).padStart(6, '0');
  };

  const generateUniqueReferralCode6Digits = async () => {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = createReferralCode6Digits();
      const existingCode = await prisma.user.findUnique({
        where: { referralCode: candidate },
        select: { id: true },
      });
      if (!existingCode) return candidate;
    }
    throw new ApiError('CONFLICT', 409, 'Unable to generate unique referral code');
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateUniqueReferralCode6Digits();
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
          select: { id: true },
        }),
        ...(oldCode
          ? [
              prisma.user.updateMany({
                where: { referredBy: oldCode },
                data: { referredBy: code },
              }),
              prisma.referralLog.updateMany({
                where: { referralCode: oldCode },
                data: { referralCode: code },
              }),
            ]
          : []),
      ]);

      return { code };
    } catch (err: any) {
      const message = String(err?.message || '');
      if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint')) {
        continue;
      }
      throw err;
    }
  }

  throw new ApiError('CONFLICT', 409, 'Failed to generate referral code');
}
