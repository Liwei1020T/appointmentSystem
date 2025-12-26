import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { generateReferralCode } from '@/server/services/profile.service';

/**
 * Referral code API
 * POST /api/profile/referral-code
 */
export async function POST() {
  try {
    const user = await requireUser();
    const result = await generateReferralCode(user.id);
    return okResponse(result);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to generate referral code', 500);
  }
}
