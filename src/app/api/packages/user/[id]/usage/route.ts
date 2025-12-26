/**
 * User package usage API
 * GET /api/packages/user/:id/usage
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listPackageUsage } from '@/server/services/package.service';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid user package id', 422, parsedParams.error.flatten());
    }

    const usage = await listPackageUsage(user.id, parsedParams.data.id);
    return okResponse(usage);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get package usage error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch package usage', 500);
  }
}
