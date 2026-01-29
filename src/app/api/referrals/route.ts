/**
 * Referrals API
 * GET /api/referrals
 */
import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getReferralsSummary } from '@/server/services/referral.service';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await requireUser();
    const data = await getReferralsSummary(user);
    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
