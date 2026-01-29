import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { generateReferralCode } from '@/server/services/profile.service';
import { handleApiError } from '@/lib/api/handleApiError';
/**
 * Referral code API
 * POST /api/profile/referral-code
 */
export async function POST() {
  try {
    const user = await requireUser();
    const result = await generateReferralCode(user.id);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
