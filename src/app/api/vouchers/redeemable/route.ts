import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getRedeemableVouchers } from '@/server/services/voucher.service';
import { handleApiError } from '@/lib/api/handleApiError';
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
  } catch (error) {
    return handleApiError(error);
  }
}
