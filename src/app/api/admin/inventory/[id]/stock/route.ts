/**
 * Admin inventory stock adjustment API
 * POST /api/admin/inventory/:id/stock
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { adjustInventoryStock } from '@/server/services/inventory.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  change: z.number(),
  type: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const result = await adjustInventoryStock(admin, parsedParams.data.id, parsedBody.data);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
