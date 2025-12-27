import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getUserReviews } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * User reviews API
 * GET /api/reviews/user
 */
export async function GET() {
  try {
    const user = await requireUser();
    const reviews = await getUserReviews(user.id);
    return okResponse(reviews);
  } catch (error) {
    return handleApiError(error);
  }
}
