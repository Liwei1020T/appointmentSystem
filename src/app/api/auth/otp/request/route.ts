/**
 * OTP Request API
 * POST /api/auth/otp/request
 *
 * Purpose:
 * - Send SMS OTP code for password reset (方案B: phone+password login, OTP for reset).
 *
 * Request:
 * - phone: string (digits or +60)
 * - purpose?: "password_reset" (optional)
 *
 * Response:
 * - { success: true, data: { cooldownSeconds: number, devCode?: string } }
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { generateOtpCode, hashOtpCode } from '@/lib/otp';
import { isValidMyPhone, toE164, toMyCanonicalPhone } from '@/lib/phone';
import { sendSms } from '@/lib/sms';
import { Prisma } from '@prisma/client';
import { handleApiError } from '@/lib/api/handleApiError';

const OTP_PURPOSE = 'password_reset';
const OTP_EXPIRES_SECONDS = 5 * 60; // 5 minutes
const OTP_COOLDOWN_SECONDS = 60; // 60s per phone
const OTP_MAX_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  try {
    /**
     * NOTE:
     * We use raw SQL here to avoid requiring a regenerated Prisma Client when developing on Windows/WSL mounts.
     * The `otp_codes` table is created via `sql/migrations/014_phone_otp_auth.sql`.
     */
    const body = await request.json();
    const phoneInput = String(body?.phone || '');
    const purpose = String(body?.purpose || OTP_PURPOSE);

    // Validate phone input
    if (!phoneInput.trim()) {
      return errorResponse('请输入手机号');
    }
    if (!isValidMyPhone(phoneInput)) {
      return errorResponse('手机号格式无效');
    }
    if (purpose !== OTP_PURPOSE) {
      return errorResponse('不支持的验证码用途');
    }

    const canonicalPhone = toMyCanonicalPhone(phoneInput);
    const now = new Date();

    // Rate limit by phone: 1/min and 5/hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sentLastHourRows = await prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM otp_codes
        WHERE phone = ${canonicalPhone}
          AND purpose = ${purpose}
          AND created_at >= ${oneHourAgo}
      `
    );
    const sentLastHour = Number(sentLastHourRows?.[0]?.count || 0);

    if (sentLastHour >= OTP_MAX_PER_HOUR) {
      return errorResponse('获取验证码过于频繁，请稍后再试');
    }

    const existingRows = await prisma.$queryRaw<{ created_at: Date }[]>(
      Prisma.sql`
        SELECT created_at
        FROM otp_codes
        WHERE phone = ${canonicalPhone}
          AND purpose = ${purpose}
        LIMIT 1
      `
    );
    const existingCreatedAt = existingRows?.[0]?.created_at;

    if (existingCreatedAt) {
      const secondsSinceLast = Math.floor((now.getTime() - new Date(existingCreatedAt).getTime()) / 1000);
      if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
        return successResponse(
          { cooldownSeconds: OTP_COOLDOWN_SECONDS - secondsSinceLast },
          '请稍后再试'
        );
      }
    }

    // Generate & store OTP hash (never store plain code)
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRES_SECONDS * 1000);

    // Upsert ensures only one active OTP per phone.
    const ip = request.headers.get('x-forwarded-for') || request.ip || null;
    const userAgent = request.headers.get('user-agent') || null;
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO otp_codes (phone, purpose, code_hash, attempts, max_attempts, expires_at, ip, user_agent, created_at, updated_at)
        VALUES (${canonicalPhone}, ${purpose}, ${codeHash}, 0, 5, ${expiresAt}, ${ip}, ${userAgent}, NOW(), NOW())
        ON CONFLICT (phone, purpose)
        DO UPDATE SET
          code_hash = EXCLUDED.code_hash,
          attempts = 0,
          max_attempts = 5,
          expires_at = EXCLUDED.expires_at,
          ip = EXCLUDED.ip,
          user_agent = EXCLUDED.user_agent,
          updated_at = NOW()
      `
    );

    const smsBody = `【String Service】重置密码验证码：${code}（5分钟内有效）。请勿泄露。`;
    await sendSms(toE164(canonicalPhone), smsBody);

    // Dev helper: optionally return OTP in response for local testing.
    const shouldReturnDevCode =
      process.env.NODE_ENV !== 'production' && process.env.SMS_DEV_RETURN_CODE === 'true';

    return successResponse(
      {
        cooldownSeconds: OTP_COOLDOWN_SECONDS,
        ...(shouldReturnDevCode ? { devCode: code } : {}),
      },
      '验证码已发送'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
