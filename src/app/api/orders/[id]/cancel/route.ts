/**
 * Order cancellation API
 * POST /api/orders/:id/cancel
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { cancelOrder } from '@/server/services/order.service';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order id', 422, parsedParams.error.flatten());
    }

    await cancelOrder(user, parsedParams.data.id);
    return okResponse({ success: true });
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Cancel order error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to cancel order', 500);
  }
}
