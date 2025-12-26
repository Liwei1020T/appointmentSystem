import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminReviewStats } from '@/server/services/review.service';

export const dynamic = 'force-dynamic';

/**
 * Admin review stats API
 * GET /api/admin/reviews/stats
 */
export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminReviewStats();
    return okResponse(stats);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch review stats', 500);
  }
}
