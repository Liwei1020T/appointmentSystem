/**
 * Order cancellation API
 * POST /api/orders/:id/cancel
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { cancelOrder } from '@/server/services/order.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { financialLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // 财务操作速率限制：防止取消订单滥用
    const clientIp = getClientIp(request);
    const rateLimitKey = `order-cancel:${user.id}:${clientIp}`;
    const rateLimitResult = financialLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetAt);
    }

    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order id', 422, parsedParams.error.flatten());
    }

    await cancelOrder(user, parsedParams.data.id);
    return okResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
