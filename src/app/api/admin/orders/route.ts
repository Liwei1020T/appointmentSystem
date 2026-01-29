/**
 * Admin orders API
 * GET /api/admin/orders
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { getAdminOrders } from '@/server/services/admin-order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.string().trim().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const data = await getAdminOrders({
      status: query.data.status,
      q: query.data.q,
      page: query.data.page,
      limit: query.data.limit,
    });

    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
