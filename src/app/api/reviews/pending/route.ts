import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getPendingReviewOrders } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * Pending review orders API
 * GET /api/reviews/pending
 */
export async function GET() {
  try {
    const user = await requireUser();
    const orders = await getPendingReviewOrders(user.id);
    return okResponse(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
