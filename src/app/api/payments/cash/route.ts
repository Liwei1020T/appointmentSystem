import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { createCashPayment } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  amount: z.preprocess((value) => Number(value), z.number().positive()),
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

    const payment = await createCashPayment({
      userId: user.id,
      orderId: parsed.data.orderId,
      amount: parsed.data.amount,
    });

    return okResponse(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
