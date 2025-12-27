/**
 * Public inventory detail API
 * GET /api/inventory/:id
 */

import { z } from 'zod';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getInventoryItem } from '@/server/services/inventory.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    const item = await getInventoryItem(parsedParams.data.id);
    return okResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}
