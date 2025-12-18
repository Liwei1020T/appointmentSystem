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
 * - If the user already has a non-empty referral code: return it.
 * - Otherwise generate a unique 8-char code (A-Z0-9), persist it, and return it.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * Generate a human-friendly referral code.
 * - Uppercase, no ambiguous chars removed (keep simple A-Z0-9).
 * - 8 chars to match existing docs/ERD examples.
 */
function createReferralCode(length: number = 8): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Ensure referral code is unique in DB, retrying a few times.
 * This is safe under concurrency because we also rely on the DB unique constraint.
 */
async function generateUniqueReferralCode(): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createReferralCode(8);
    const existing = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error('Unable to generate unique referral code');
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
    if (currentCode) {
      return successResponse({ code: currentCode });
    }

    // Generate + persist (handle potential unique conflicts by retrying)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = await generateUniqueReferralCode();
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: code },
          select: { id: true },
        });
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

