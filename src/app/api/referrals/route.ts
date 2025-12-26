/**
 * Referrals API
 * GET /api/referrals
 */

import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getReferralsSummary } from '@/server/services/referral.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getReferralsSummary(user);
    return okResponse(data);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch referrals', 500);
  }
}
