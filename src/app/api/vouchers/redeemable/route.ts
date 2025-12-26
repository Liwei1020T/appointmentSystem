import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getRedeemableVouchers } from '@/server/services/voucher.service';

export const dynamic = 'force-dynamic';

/**
 * Redeemable vouchers API
 * GET /api/vouchers/redeemable
 */
export async function GET() {
  try {
    const user = await requireUser();
    const vouchers = await getRedeemableVouchers(user.id);
    return okResponse({ vouchers });
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch redeemable vouchers', 500);
  }
}
