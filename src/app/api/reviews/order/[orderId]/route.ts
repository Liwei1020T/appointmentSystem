import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getReviewByOrder } from '@/server/services/review.service';

export const dynamic = 'force-dynamic';

/**
 * Review by order API
 * GET /api/reviews/order/:orderId
 */
export async function GET(
  _request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await requireUser();
    const review = await getReviewByOrder(user, params?.orderId);
    return okResponse(review);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch review', 500);
  }
}
