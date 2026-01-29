import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { getAdminOrderStats } from '@/server/services/admin-order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

/**
 * Admin order stats API
 * GET /api/admin/orders/stats
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const stats = await getAdminOrderStats({
      startDate: query.data.startDate ?? null,
      endDate: query.data.endDate ?? null,
    });
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
