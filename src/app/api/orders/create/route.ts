/**
 * Legacy order creation API (package/voucher flow)
 * POST /api/orders/create
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { createOrderWithPackage } from '@/server/services/order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const createOrderSchema = z
  .object({
    stringId: z.string().uuid().optional(),
    string_id: z.string().uuid().optional(),
    tension: z.number(),
    usePackage: z.boolean().optional(),
    packageId: z.string().uuid().optional(),
    voucherId: z.string().uuid().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.stringId && !data.string_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'stringId or string_id is required',
        path: ['stringId'],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
    }

    const payload = parsed.data;
    const result = await createOrderWithPackage(user, {
      stringId: payload.stringId || payload.string_id!,
      tension: payload.tension,
      usePackage: payload.usePackage,
      packageId: payload.packageId,
      voucherId: payload.voucherId,
      notes: payload.notes,
    });

    return okResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
