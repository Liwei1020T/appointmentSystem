/**
 * 用户注册 API
 * POST /api/auth/signup
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidMyPhone, toMyCanonicalPhone } from '@/lib/phone';
import { normalizeMyPhone, validatePassword } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

/**
 * Generate a unique 6-digit numeric referral code.
 *
 * Why:
 * - UI requirement: “邀请码为6位数”
 * - Keep it human-friendly and easy to type.
 */
async function generateUniqueReferralCode6Digits(): Promise<string> {
  const maxAttempts = 15;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const n = Math.floor(Math.random() * 1_000_000);
    const code = String(n).padStart(6, '0');
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error('Unable to generate unique referral code');
}

export async function POST(request: NextRequest) {
  try {
    /**
     * Phone + Password Signup
     *
     * Data flow:
     * - Create account with phone + password (no email).
     * - Referral reward is applied immediately after user creation.
     */
    const body = await request.json();
    const fullName = String(body?.fullName || '');
    const phoneInput = String(body?.phone || '');
    const password = String(body?.password || '');
    const referralCode = body?.referralCode ? String(body.referralCode) : undefined;

    if (!fullName.trim() || !phoneInput.trim() || !password.trim()) {
      return errorResponse('请填写所有必填字段');
    }

    if (!isValidMyPhone(phoneInput)) {
      return errorResponse('手机号格式无效');
    }

    if (!validatePassword(password)) {
      return errorResponse('密码至少8位，包含大小写字母和数字');
    }

    const phoneDigits = normalizeMyPhone(phoneInput);
    const canonicalPhone = toMyCanonicalPhone(phoneDigits);

    // Check phone uniqueness
    const existingByPhone = await prisma.user.findFirst({
      where: { OR: [{ phone: canonicalPhone }, { phone: phoneDigits }] },
      select: { id: true },
    });
    if (existingByPhone) {
      return errorResponse('该手机号已被注册');
    }

    // Validate referral code (optional)
    let referrer: { id: string; points: number } | null = null;
    if (referralCode?.trim()) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
        select: { id: true, points: true },
      });
      if (!referrer) {
        return errorResponse('邀请码无效');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rewardPoints = Number.parseInt(process.env.REFERRAL_REWARD_POINTS || '50', 10);
    const internalEmail = `u_${canonicalPhone}@phone.local`;
    const referralCodeForUser = await generateUniqueReferralCode6Digits();

    // Create user
    const user = await prisma.user.create({
      data: {
        // Email is kept only for backward compatibility. We generate an internal synthetic email.
        email: internalEmail,
        phone: canonicalPhone,
        fullName: fullName.trim(),
        password: hashedPassword,
        referralCode: referralCodeForUser,
        referredBy: referralCode?.trim() || null,
        role: 'customer',
        points: referrer ? rewardPoints : 0,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        referralCode: true,
        points: true,
      },
    });

    // Apply referral rewards (both sides)
    if (referrer) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: rewardPoints } },
        }),
        prisma.pointsLog.create({
          data: {
            userId: referrer.id,
            amount: rewardPoints,
            type: 'referral',
            referenceId: user.id,
            description: `推荐用户 ${canonicalPhone}`,
            balanceAfter: (referrer.points || 0) + rewardPoints,
          },
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
        prisma.referralLog.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            referralCode: referralCode!.trim(),
            rewardGiven: true,
          },
        }),
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'system',
            title: '注册奖励',
            message: `注册成功，获得 ${rewardPoints} 积分`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: referrer.id,
            type: 'system',
            title: '邀请奖励',
            message: `成功邀请新用户，获得 ${rewardPoints} 积分`,
          },
        }),
      ]);
    }

    return successResponse(
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          referralCode: user.referralCode,
          points: user.points,
        },
      },
      '注册成功'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
