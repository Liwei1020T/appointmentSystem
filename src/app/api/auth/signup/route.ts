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
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { issueWelcomeVouchers } from '@/server/services/welcome.service';
import { processReferralReward } from '@/server/services/referral.service';

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
  // Rate Limiting: 每分钟最多 5 次注册请求
  const clientIp = getClientIp(request);
  const rateLimitResult = authLimiter.check(clientIp);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.resetAt);
  }

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
    const internalEmail = `u_${canonicalPhone}@phone.local`;
    const referralCodeForUser = await generateUniqueReferralCode6Digits();

    // Create user (初始积分为0，推荐奖励由 processReferralReward 处理)
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
        points: 0,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        referralCode: true,
        points: true,
      },
    });

    // Apply tiered referral rewards (阶梯式奖励)
    if (referrer) {
      try {
        const result = await processReferralReward(
          referrer.id,
          user.id,
          referralCode!.trim(),
          canonicalPhone
        );

        // 如果有新获得的徽章，记录日志
        if (result.newBadges.length > 0) {
          console.log(
            `User ${referrer.id} earned new badges:`,
            result.newBadges.join(', ')
          );
        }
      } catch (referralError) {
        // 推荐奖励失败不影响注册流程，仅记录日志
        console.error('Failed to process referral reward:', referralError);
      }
    }

    // 发放新用户欢迎礼包（自动发放的优惠券）
    try {
      await issueWelcomeVouchers(user.id);
    } catch (welcomeError) {
      // 欢迎礼包发放失败不影响注册流程，仅记录日志
      console.error('Failed to issue welcome vouchers:', welcomeError);
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
