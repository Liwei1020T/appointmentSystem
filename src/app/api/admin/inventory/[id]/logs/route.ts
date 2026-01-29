/**
 * Admin inventory logs API (per string)
 * GET /api/admin/inventory/:id/logs
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { listInventoryLogs } from '@/server/services/inventory.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const querySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

function parsePositiveInt(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
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
      stringId: parsedParams.data.id,
      limit: limit ?? undefined,
      offset: offset ?? undefined,
    });
    return okResponse(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
