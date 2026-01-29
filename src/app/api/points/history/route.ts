import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { getPointsHistory } from '@/server/services/points.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.string().trim().optional(),
});

/**
 * Points history API
 * GET /api/points/history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const logs = await getPointsHistory(user.id, {
      limit: query.data.limit,
      type: query.data.type,
    });
    return okResponse({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
