import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getReferralLeaderboard } from '@/server/services/referral.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

/**
 * Referral leaderboard API
 * GET /api/referrals/leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const limit = query.data.limit ?? 10;
    const entries = await getReferralLeaderboard(limit);
    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      fullName: entry.fullName,
      referralCount: entry.referralCount,
      totalPoints: entry.totalPoints,
      isCurrentUser: entry.userId === user.id,
    }));

    return okResponse({ leaderboard });
  } catch (error) {
    return handleApiError(error);
  }
}
