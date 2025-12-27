/**
 * User packages API
 * GET /api/packages/user
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listUserPackages } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      status: url.searchParams.get('status') || undefined,
    });

    if (!parsedQuery.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query params', 422, parsedQuery.error.flatten());
    }

    const packages = await listUserPackages(user.id, parsedQuery.data.status);
    return okResponse(packages);
  } catch (error) {
    return handleApiError(error);
  }
}
