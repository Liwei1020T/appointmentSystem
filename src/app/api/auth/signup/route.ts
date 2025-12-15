/**
 * 用户注册 API
 * POST /api/auth/signup
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, referralCode } = body;

    // 验证必填字段
    if (!email || !password || !fullName) {
      return errorResponse('请填写所有必填字段');
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('邮箱格式无效');
    }

    // 验证密码强度
    if (password.length < 8) {
      return errorResponse('密码至少需要 8 个字符');
    }

    // 验证手机号（如有）
    if (phone) {
      const phoneClean = phone.replace(/\D/g, '');
      if (!/^(601\d{8,9}|01\d{8,9})$/.test(phoneClean)) {
        return errorResponse('手机号格式无效');
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('该邮箱已被注册');
    }

    // 验证邀请码（如有）
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });

      if (!referrer) {
        return errorResponse('邀请码无效');
      }
      referrerId = referrer.id;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        referredBy: referralCode || null,
        role: 'customer',
        points: 0,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        referralCode: true,
      },
    });

    // 处理推荐奖励
    if (referrerId) {
      const rewardPoints = parseInt(process.env.REFERRAL_REWARD_POINTS || '50');

      // 给推荐人积分
      await prisma.$transaction([
        prisma.user.update({
          where: { id: referrerId },
          data: { points: { increment: rewardPoints } },
        }),
        prisma.pointsLog.create({
          data: {
            userId: referrerId,
            amount: rewardPoints,
            type: 'referral',
            referenceId: user.id,
            description: `推荐用户 ${email}`,
            balanceAfter: 0, // 将在事后查询
          },
        }),
        // 给新用户积分
        prisma.user.update({
          where: { id: user.id },
          data: { points: rewardPoints },
        }),
        prisma.pointsLog.create({
          data: {
            userId: user.id,
            amount: rewardPoints,
            type: 'referral',
            description: '注册奖励',
            balanceAfter: rewardPoints,
          },
        }),
        // 记录推荐关系
        prisma.referralLog.create({
          data: {
            referrerId,
            referredId: user.id,
            referralCode: referralCode!,
            rewardGiven: true,
          },
        }),
      ]);

      // 更新积分日志的 balanceAfter
      const referrerUser = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { points: true },
      });
      
      await prisma.pointsLog.updateMany({
        where: {
          userId: referrerId,
          referenceId: user.id,
          type: 'referral',
        },
        data: {
          balanceAfter: referrerUser?.points || 0,
        },
      });
    }

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          referralCode: user.referralCode,
        },
      },
      '注册成功'
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return errorResponse('注册失败', 500);
  }
}
