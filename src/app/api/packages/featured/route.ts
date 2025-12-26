/**
 * Featured packages API
 * GET /api/packages/featured
 */

import { z } from 'zod';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listFeaturedPackages } from '@/server/services/package.service';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      limit: url.searchParams.get('limit') || undefined,
    });

    if (!parsedQuery.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query params', 422, parsedQuery.error.flatten());
    }

    const limit = parsedQuery.data.limit ? Number(parsedQuery.data.limit) : 3;
    if (!Number.isFinite(limit) || limit <= 0) {
      return failResponse('UNPROCESSABLE_ENTITY', 'limit must be a positive number', 422);
    }

    const packages = await listFeaturedPackages(limit);
    return okResponse(packages);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get featured packages error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch featured packages', 500);
  }
}
