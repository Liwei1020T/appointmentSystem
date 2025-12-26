/**
 * Public inventory API
 * GET /api/inventory
 */

import { z } from 'zod';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listInventory } from '@/server/services/inventory.service';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  active: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      active: url.searchParams.get('active') || undefined,
    });

    if (!parsedQuery.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query params', 422, parsedQuery.error.flatten());
    }

    const activeOnly = parsedQuery.data.active !== 'false';
    const inventory = await listInventory(activeOnly);
    return okResponse(inventory);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get inventory error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch inventory', 500);
  }
}
