import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminReviewStats } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

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
  } catch (error) {
    return handleApiError(error);
  }
}
