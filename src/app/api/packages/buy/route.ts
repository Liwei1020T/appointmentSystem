/**
 * Package purchase API
 * POST /api/packages/buy
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { buyPackage } from '@/server/services/package.service';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const result = await buyPackage(user, parsedBody.data);
    return okResponse(result, { status: 201 });
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Buy package error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to create package payment', 500);
  }
}
