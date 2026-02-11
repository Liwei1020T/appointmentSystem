/**
 * 新用户欢迎礼包服务
 * 处理注册时自动发放优惠券逻辑
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/api-errors';

/**
 * 为新用户发放欢迎礼包（自动发放的优惠券）
 * 在用户注册成功后调用
 *
 * @param userId - 新注册用户的 ID
 * @returns 发放的优惠券数量
 */
export async function issueWelcomeVouchers(userId: string): Promise<number> {
  const now = new Date();

  // 查找所有自动发放的欢迎优惠券
  const welcomeVouchers = await prisma.voucher.findMany({
    where: {
      active: true,
      isAutoIssue: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
  });

  if (welcomeVouchers.length === 0) {
    return 0;
  }

  // 批量创建用户优惠券
  const userVouchersData = welcomeVouchers.map((voucher) => {
    // 如果设置了 validityDays，则从当前时间计算过期时间
    // 否则使用优惠券本身的 validUntil
    let expiry: Date;
    if (voucher.validityDays && voucher.validityDays > 0) {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + voucher.validityDays);
    } else {
      expiry = new Date(voucher.validUntil);
    }

    return {
      userId,
      voucherId: voucher.id,
      status: 'active',
      expiry,
    };
  });

  // 使用事务批量创建
  await prisma.$transaction(async (tx) => {
    // 创建用户优惠券
    await tx.userVoucher.createMany({
      data: userVouchersData,
    });

    // 更新每个优惠券的使用计数
    for (const voucher of welcomeVouchers) {
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 创建欢迎通知
    const voucherNames = welcomeVouchers.map((v) => v.name).join('、');
    await tx.notification.create({
      data: {
        userId,
        type: 'system',
        title: '🎁 欢迎礼包',
        message: `恭喜获得新用户礼包：${voucherNames}，快去使用吧！`,
        actionUrl: '/vouchers',
      },
    });
  });

  return welcomeVouchers.length;
}

/**
 * 检查用户是否为首单（用于验证首单专属优惠券）
 *
 * @param userId - 用户 ID
 * @returns 是否为首单
 */
export async function isUserFirstOrder(userId: string): Promise<boolean> {
  const orderCount = await prisma.order.count({
    where: {
      userId,
      status: { in: ['completed', 'in_progress'] },
    },
  });
  return orderCount === 0;
}

/**
 * 校验首单优惠券的使用资格
 *
 * @param userId - 用户 ID
 * @param isFirstOrderOnly - 是否首单专属
 */
export async function assertFirstOrderVoucherEligibility(
  userId: string,
  isFirstOrderOnly: boolean
): Promise<void> {
  if (!isFirstOrderOnly) return;

  const isFirstOrder = await isUserFirstOrder(userId);
  if (!isFirstOrder) {
    throw new AppError('UNPROCESSABLE_ENTITY', 422, '此优惠券仅限首单使用');
  }
}

/**
 * 验证优惠券是否可用于当前订单
 * 增加首单专属优惠券的检查
 *
 * @param userVoucherId - 用户优惠券 ID
 * @param userId - 用户 ID
 * @returns 验证结果
 */
export async function validateVoucherForOrder(
  userVoucherId: string,
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  const userVoucher = await prisma.userVoucher.findUnique({
    where: { id: userVoucherId },
    include: { voucher: true },
  });

  if (!userVoucher) {
    return { valid: false, reason: '优惠券不存在' };
  }

  if (userVoucher.userId !== userId) {
    return { valid: false, reason: '优惠券不属于当前用户' };
  }

  if (userVoucher.status !== 'active') {
    return { valid: false, reason: '优惠券已使用或已过期' };
  }

  const now = new Date();
  if (userVoucher.expiry < now) {
    return { valid: false, reason: '优惠券已过期' };
  }

  // 检查首单专属
  if (userVoucher.voucher.isFirstOrderOnly) {
    const isFirst = await isUserFirstOrder(userId);
    if (!isFirst) {
      return { valid: false, reason: '此优惠券仅限首单使用' };
    }
  }

  return { valid: true };
}
