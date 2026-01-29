import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getMyReferralStats } from '@/server/services/referral.service';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
/**
 * My referral stats API
 * GET /api/referrals/my-stats
 */
export async function GET() {
  try {
    const user = await requireUser();
    const stats = await getMyReferralStats(user.id);
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
