import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getReviewByOrder } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';
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
  } catch (error) {
    return handleApiError(error);
  }
}
