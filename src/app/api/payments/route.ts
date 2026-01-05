import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { createPayment } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({
    amount: z.preprocess((value) => Number(value), z.number().positive()),
    orderId: z.string().uuid().optional().nullable(),
    packageId: z.string().uuid().optional().nullable(),
    paymentMethod: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.orderId || data.packageId, {
    message: 'orderId or packageId is required',
    path: ['orderId'],
  });

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const parsed = await parseJson(request, bodySchema);

    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse(
        'UNPROCESSABLE_ENTITY',
        'Invalid request body',
        422,
        parsed.error.flatten()
      );
    }

    const payment = await createPayment({
      userId: user.id,
      amount: parsed.data.amount,
      orderId: parsed.data.orderId ?? null,
      packageId: parsed.data.packageId ?? null,
      paymentMethod: parsed.data.paymentMethod ?? null,
    });

    return okResponse(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
