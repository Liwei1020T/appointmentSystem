/**
 * Admin inventory logs API (all strings)
 * GET /api/admin/inventory/logs
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listInventoryLogs } from '@/server/services/inventory.service';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  stringId: z.string().uuid().optional(),
});

function parsePositiveInt(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
      stringId: url.searchParams.get('stringId') || undefined,
    });

    if (!parsedQuery.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query params', 422, parsedQuery.error.flatten());
    }

    const limit = parsePositiveInt(parsedQuery.data.limit);
    const offset = parsePositiveInt(parsedQuery.data.offset);

    if (limit === null || offset === null) {
      return failResponse('UNPROCESSABLE_ENTITY', 'limit/offset must be positive numbers', 422);
    }

    const logs = await listInventoryLogs({
      stringId: parsedQuery.data.stringId,
      limit: limit ?? undefined,
      offset: offset ?? undefined,
    });

    return okResponse(logs);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get inventory logs error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch inventory logs', 500);
  }
}
