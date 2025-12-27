import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { setAdminPackageStatus } from '@/server/services/admin-package.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  active: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid package id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const active = parsedBody.data.active ?? parsedBody.data.isActive;
    if (active === undefined) {
      return failResponse('BAD_REQUEST', 'active is required', 400);
    }

    const pkg = await setAdminPackageStatus(parsedParams.data.id, active);
    return okResponse(pkg);
  } catch (error) {
    return handleApiError(error);
  }
}
