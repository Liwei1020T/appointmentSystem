import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listPackagePurchases } from '@/server/services/admin-package.service';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  userId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, parsed.error.flatten());
    }

    const payload = await listPackagePurchases(parsed.data);
    return okResponse(payload);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch package purchases', 500);
  }
}
