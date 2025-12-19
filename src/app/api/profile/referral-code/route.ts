/**
 * Generate/return the authenticated user's referral code.
 *
 * POST /api/profile/referral-code
 *
 * Why this exists:
 * - The profile UI calls this endpoint to ensure the user has a referral code.
 * - Some legacy rows may have `referral_code` missing/blank after migrations.
 *
 * Behavior:
 * - If the user already has a 6-digit numeric referral code: return it.
 * - If the user has a legacy (non-6-digit) referral code: migrate it to a 6-digit code and update references.
 * - Otherwise generate a unique 6-digit numeric code, persist it, and return it.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * Generate a 6-digit numeric referral code.
 * - Digits only to match the UI requirement (“6位数”).
 * - Leading zeros are allowed.
 */
function createReferralCode6Digits(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, '0');
}

/**
 * Ensure referral code is unique in DB, retrying a few times.
 * This is safe under concurrency because we also rely on the DB unique constraint.
 */
async function generateUniqueReferralCode6Digits(): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createReferralCode6Digits();
    const existing = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error('Unable to generate unique referral code');
}

function isSixDigitReferralCode(code: string): boolean {
  return /^[0-9]{6}$/.test(String(code || '').trim());
}

export async function POST() {
  try {
    const user = await requireAuth();

    // Read current referral code
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    });

    const currentCode = (existing?.referralCode || '').trim();
    if (currentCode && isSixDigitReferralCode(currentCode)) {
      return successResponse({ code: currentCode });
    }

    /**
     * If user has a legacy code (e.g., cuid), migrate it:
     * - Update user's own referralCode
     * - Update users.referredBy that points to the old code
     * - Update referral_logs.referral_code that stores the old code
     *
     * Note:
     * - This will make the old code invalid going forward.
     * - We do this to keep the referral system consistent after shortening codes.
     */
    const oldCode = currentCode || null;

    // Generate + persist (handle potential unique conflicts by retrying)
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

        return successResponse({ code });
      } catch (err: any) {
        // If a unique constraint collision happens, retry.
        const message = String(err?.message || '');
        if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint')) {
          continue;
        }
        throw err;
      }
    }

    return errorResponse('Failed to generate referral code', 500);
  } catch (error: any) {
    // `requireAuth()` throws an error with a `.json()` helper.
    if (typeof error?.json === 'function') return error.json();
    console.error('Generate referral code error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate referral code' }, { status: 500 });
  }
}
