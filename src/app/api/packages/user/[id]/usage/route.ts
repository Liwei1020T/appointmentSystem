/**
 * User package usage API
 * GET /api/packages/user/:id/usage
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { listPackageUsage } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';

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
    return handleApiError(error);
  }
}
