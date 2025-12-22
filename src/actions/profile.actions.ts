'use server';

import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { validatePassword } from '@/lib/utils';
import {
  getTierForSpend,
  getTierProgress,
  getNextTierAfterSpend,
} from '@/lib/membership';

export interface ProfileStats {
  totalOrders: number;
  activePackages: number;
  activeVouchers: number;
}

export interface UserProfileActionResult {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  points: number;
  referralCode: string | null;
  referredBy: string | null;
  role: string;
  createdAt: Date;
  full_name: string | null;
  avatar_url: string | null;
  stats: ProfileStats;
}

/**
 * 获取当前用户个人资料（Server Action）
 */
export async function getUserProfileAction(): Promise<UserProfileActionResult> {
  const user = await requireAuth();

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
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
    throw new Error('用户不存在');
  }

  const [orderCount, packageCount, voucherCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.userPackage.count({ where: { userId: user.id, status: 'active' } }),
    prisma.userVoucher.count({ where: { userId: user.id, status: 'active' } }),
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

export interface UpdateProfileParams {
  fullName?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  avatarUrl?: string;
}

/**
 * 更新当前用户资料（Server Action）
 */
export async function updateUserProfileAction(
  payload: UpdateProfileParams
): Promise<UserProfileActionResult> {
  const user = await requireAuth();
  const resolvedFullName = payload.fullName ?? payload.full_name;
  const resolvedAvatarUrl = payload.avatarUrl ?? payload.avatar_url;
  const updateData: Record<string, unknown> = {};

  if (resolvedFullName !== undefined) {
    updateData.fullName = resolvedFullName;
  }
  if (payload.phone !== undefined) {
    updateData.phone = payload.phone;
  }
  if (payload.address !== undefined) {
    updateData.address = payload.address;
  }
  if (resolvedAvatarUrl !== undefined) {
    updateData.avatarUrl = resolvedAvatarUrl;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
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
    prisma.order.count({ where: { userId: user.id } }),
    prisma.userPackage.count({ where: { userId: user.id, status: 'active' } }),
    prisma.userVoucher.count({ where: { userId: user.id, status: 'active' } }),
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
 * 获取用户统计信息（Server Action）
 */
export async function getUserStatsAction() {
  const user = await requireAuth();

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
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id, status: 'pending' } }),
    prisma.order.count({ where: { userId: user.id, status: 'completed' } }),
    prisma.userPackage.count({
      where: {
        userId: user.id,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
    }),
    prisma.userPackage.aggregate({
      where: {
        userId: user.id,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
      _sum: { remaining: true },
    }),
    prisma.userVoucher.count({
      where: {
        userId: user.id,
        status: 'active',
        expiry: { gt: new Date() },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { points: true } }),
    prisma.order.aggregate({ where: { userId: user.id }, _sum: { price: true } }),
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
 * 更新用户密码（Server Action）
 */
export async function changePasswordAction(params: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ ok: boolean }>{
  const user = await requireAuth();
  const currentPassword = params.currentPassword ? String(params.currentPassword) : '';
  const newPassword = String(params.newPassword || '');

  if (!newPassword.trim()) {
    throw new Error('请输入新密码');
  }
  if (!validatePassword(newPassword)) {
    throw new Error('密码至少8位，包含大小写字母和数字');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (dbUser?.password) {
    if (!currentPassword.trim()) {
      throw new Error('请输入当前密码');
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.password);
    if (!ok) {
      throw new Error('当前密码错误');
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { ok: true };
}

/**
 * 生成或修复当前用户推荐码（Server Action）
 */
export async function generateReferralCodeAction(): Promise<{ code: string }>{
  const user = await requireAuth();

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
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
    throw new Error('Unable to generate unique referral code');
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateUniqueReferralCode6Digits();
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
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

  throw new Error('Failed to generate referral code');
}
