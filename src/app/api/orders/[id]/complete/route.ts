/**
 * Order completion API (admin only)
 * POST /api/orders/:id/complete
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { completeOrder } from '@/server/services/order.service';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  adminNotes: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const result = await completeOrder(admin, parsedParams.data.id, parsedBody.data.adminNotes);
    return okResponse(result);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Complete order error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to complete order', 500);
  }
}
