/**
 * Order photos reorder API (admin only)
 * POST /api/orders/:id/photos/reorder
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { reorderOrderPhotos } from '@/server/services/order-photos.service';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  photos: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().nonnegative(),
    })
  ),
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
      return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    await reorderOrderPhotos(admin, parsedParams.data.id, parsedBody.data.photos);
    return okResponse({ success: true });
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Reorder order photos error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to reorder order photos', 500);
  }
}
