import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getVoucherStats } from '@/server/services/voucher.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * Voucher stats API
 * GET /api/vouchers/stats
 */
export async function GET() {
  try {
    const user = await requireUser();
    const stats = await getVoucherStats(user.id);
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
