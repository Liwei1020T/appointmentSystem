import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminDashboardStats } from '@/server/services/stats.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const limit = query.data.limit ?? 5;
    const data = await getAdminDashboardStats(limit);
    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
