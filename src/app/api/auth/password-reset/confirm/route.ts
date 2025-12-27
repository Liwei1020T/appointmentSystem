/**
 * Password Reset Confirm API
 * POST /api/auth/password-reset/confirm
 *
 * Purpose:
 * - Verify OTP for password reset and update user's password hash.
 *
 * Request:
 * - phone: string
 * - code: string (6 digits)
 * - newPassword: string
 *
 * Response:
 * - { success: true }
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { hashOtpCode, timingSafeEqualHex } from '@/lib/otp';
import { isValidMyPhone, toMyCanonicalPhone } from '@/lib/phone';
import { normalizeMyPhone, validatePassword } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import { handleApiError } from '@/lib/api/handleApiError';

const OTP_PURPOSE = 'password_reset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneInput = String(body?.phone || '');
    const codeInput = String(body?.code || '');
    const newPassword = String(body?.newPassword || '');

    if (!phoneInput.trim() || !codeInput.trim() || !newPassword.trim()) {
      return errorResponse('请填写所有必填字段');
    }

    if (!isValidMyPhone(phoneInput)) {
      return errorResponse('手机号格式无效');
    }

    if (!/^[0-9]{6}$/.test(codeInput.trim())) {
      return errorResponse('验证码格式无效');
    }

    if (!validatePassword(newPassword)) {
      return errorResponse('密码至少8位，包含大小写字母和数字');
    }

    const phoneDigits = normalizeMyPhone(phoneInput);
    const canonicalPhone = toMyCanonicalPhone(phoneDigits);

    /**
     * NOTE:
     * We use raw SQL to avoid requiring a regenerated Prisma Client on Windows/WSL mounts.
     */
    const otpRows = await prisma.$queryRaw<
      {
        id: string;
        code_hash: string;
        attempts: number;
        max_attempts: number;
        expires_at: Date;
      }[]
    >(
      Prisma.sql`
        SELECT id, code_hash, attempts, max_attempts, expires_at
        FROM otp_codes
        WHERE phone = ${canonicalPhone}
          AND purpose = ${OTP_PURPOSE}
        LIMIT 1
      `
    );
    const otp = otpRows?.[0];

    if (!otp) {
      return errorResponse('验证码已过期，请重新获取');
    }

    const now = new Date();
    if (new Date(otp.expires_at) <= now) {
      await prisma.$executeRaw(
        Prisma.sql`DELETE FROM otp_codes WHERE id = ${otp.id}`
      ).catch(() => null);
      return errorResponse('验证码已过期，请重新获取');
    }

    if (otp.attempts >= otp.max_attempts) {
      await prisma.$executeRaw(
        Prisma.sql`DELETE FROM otp_codes WHERE id = ${otp.id}`
      ).catch(() => null);
      return errorResponse('验证码错误次数过多，请重新获取');
    }

    const expectedHash = String(otp.code_hash || '');
    const actualHash = hashOtpCode(codeInput);
    const ok = timingSafeEqualHex(expectedHash, actualHash);

    if (!ok) {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE otp_codes SET attempts = attempts + 1, updated_at = NOW() WHERE id = ${otp.id}`
      );
      return errorResponse('验证码错误');
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ phone: canonicalPhone }, { phone: phoneDigits }] },
      select: { id: true },
    });

    if (!user) {
      return errorResponse('手机号未注册');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Consume OTP + update password atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, phone: canonicalPhone },
      }),
      prisma.$executeRaw(Prisma.sql`DELETE FROM otp_codes WHERE id = ${otp.id}`),
    ]);

    return successResponse({ ok: true }, '密码已重置');
  } catch (error) {
    return handleApiError(error);
  }
}
