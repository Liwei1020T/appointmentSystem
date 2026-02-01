/**
 * OTP Utilities
 *
 * Purpose:
 * - Generate and verify SMS one-time passwords for phone-based auth (方案B).
 * - Store only hashed codes in DB (never store the plain code).
 */

import crypto from 'crypto';

/**
 * Generate a 6-digit numeric OTP code.
 *
 * @returns 6-digit code as string (e.g. "123456")
 */
export function generateOtpCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

/**
 * Hash an OTP code with a server secret.
 *
 * Data flow:
 * - Request endpoint generates a code and stores only the hash.
 * - Credentials authorize() hashes the user input and compares.
 *
 * @param code - 6-digit user input
 * @returns sha256 hex hash
 */
export function hashOtpCode(code: string): string {
  const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET;

  // 生产环境必须配置 OTP_SECRET 或 NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SECURITY ERROR: OTP_SECRET or NEXTAUTH_SECRET must be configured in production. ' +
          'Generate with: openssl rand -base64 32'
      );
    }
    // 开发环境使用弱密钥并输出警告
    console.warn(
      '⚠️  WARNING: Using weak OTP secret in development. ' +
        'Set OTP_SECRET or NEXTAUTH_SECRET for production.'
    );
    return crypto
      .createHash('sha256')
      .update(`dev-secret-not-for-production:${String(code || '').trim()}`)
      .digest('hex');
  }

  return crypto
    .createHash('sha256')
    .update(`${secret}:${String(code || '').trim()}`)
    .digest('hex');
}

/**
 * Timing-safe compare for OTP hashes.
 *
 * @param expectedHash - hash stored in DB
 * @param actualHash - hash computed from user input
 */
export function timingSafeEqualHex(expectedHash: string, actualHash: string): boolean {
  try {
    const a = Buffer.from(String(expectedHash || ''), 'hex');
    const b = Buffer.from(String(actualHash || ''), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

