import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminReviews } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

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
  } catch (error) {
    return handleApiError(error);
  }
}
