/**
 * 兑换优惠券 API
 * POST /api/vouchers/redeem
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { code, usePoints } = body;

    if (!code) {
      return errorResponse('请输入优惠券代码');
    }

    // 查找优惠券
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return errorResponse('优惠券不存在');
    }

    if (!voucher.active) {
      return errorResponse('优惠券已失效');
    }

    // 检查有效期
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      return errorResponse('优惠券不在有效期内');
    }

    // 检查使用次数
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return errorResponse('优惠券已被领完');
    }

    // 检查用户是否已领取
    const existingUserVoucher = await prisma.userVoucher.findFirst({
      where: {
        userId: user.id,
        voucherId: voucher.id,
      },
    });

    if (existingUserVoucher) {
      return errorResponse('您已领取过此优惠券');
    }

    // 如果需要积分兑换
    if (usePoints && voucher.pointsCost > 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { points: true },
      });

      if (!currentUser || currentUser.points < voucher.pointsCost) {
        return errorResponse(`积分不足，需要 ${voucher.pointsCost} 积分`);
      }

      // 扣除积分并创建优惠券
      await prisma.$transaction(async (tx) => {
        // 扣除积分
        const newBalance = currentUser.points - voucher.pointsCost;
        await tx.user.update({
          where: { id: user.id },
          data: { points: newBalance },
        });

        // 记录积分日志
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

        // 创建用户优惠券
        const expiryDate = new Date(voucher.validUntil);
        await tx.userVoucher.create({
          data: {
            userId: user.id,
            voucherId: voucher.id,
            status: 'active',
            expiry: expiryDate,
          },
        });

        // 更新优惠券使用次数
        await tx.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      });
    } else {
      // 免费领取
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

    return successResponse(
      { voucherName: voucher.name },
      '优惠券领取成功'
    );
  } catch (error: any) {
    console.error('Redeem voucher error:', error);
    return errorResponse(error.message || '领取优惠券失败', 500);
  }
}
