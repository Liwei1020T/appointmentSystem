import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminReviews } from '@/server/services/review.service';

export const dynamic = 'force-dynamic';

/**
 * Admin reviews list API
 * GET /api/admin/reviews
 */
export async function GET() {
  try {
    await requireAdmin();
    const reviews = await getAdminReviews();
    return okResponse(reviews);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch reviews', 500);
  }
}
