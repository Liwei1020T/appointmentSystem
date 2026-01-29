/**
 * User vouchers API
 * GET /api/vouchers/user
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { getUserVouchers, getUserVouchersMapped } from '@/server/services/voucher.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.string().trim().optional(),
  mapped: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const vouchers = query.data.mapped
      ? await getUserVouchersMapped(user.id, query.data.status)
      : await getUserVouchers(user.id, query.data.status);

    return okResponse({ vouchers });
  } catch (error) {
    return handleApiError(error);
  }
}
