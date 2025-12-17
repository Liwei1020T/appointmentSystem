/**
 * Redeem voucher by voucherId using points
 * POST /api/vouchers/redeem-with-points
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { voucherId, points } = body;

    if (!voucherId) {
      return errorResponse('缺少优惠券ID');
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      return errorResponse('优惠券不存在');
    }

    if (!voucher.active) {
      return errorResponse('优惠券已失效');
    }

    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      return errorResponse('优惠券不在有效期内');
    }

    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return errorResponse('优惠券已被领完');
    }

    const existingUserVoucher = await prisma.userVoucher.findFirst({
      where: {
        userId: user.id,
        voucherId: voucher.id,
      },
    });

    if (existingUserVoucher) {
      return errorResponse('您已领取过此优惠券');
    }

    const requiredPoints = voucher.pointsCost || 0;
    const pointsToUse = Number.isFinite(Number(points)) ? Number(points) : requiredPoints;

    if (requiredPoints > 0 && pointsToUse < requiredPoints) {
      return errorResponse(`积分不足，需要 ${requiredPoints} 积分`);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true },
    });

    if (!currentUser || currentUser.points < requiredPoints) {
      return errorResponse(`积分不足，需要 ${requiredPoints} 积分`);
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

    return successResponse(
      {
        userVoucher: result.userVoucher,
        balance: result.balance,
      },
      '兑换成功'
    );
  } catch (error: any) {
    console.error('Redeem voucher with points error:', error);
    return errorResponse(error.message || '兑换失败', 500);
  }
}
