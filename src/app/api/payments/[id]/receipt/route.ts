import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { recordPaymentProof } from '@/server/services/payment.service';

const bodySchema = z.object({
  receiptUrl: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params?.id;

    if (!isValidUUID(paymentId)) {
      return failResponse('BAD_REQUEST', 'Invalid payment id', 400);
    }

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

    await recordPaymentProof({
      paymentId,
      userId: user.id,
      proofUrl: parsed.data.receiptUrl,
    });

    return okResponse({ receiptUrl: parsed.data.receiptUrl });
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    if (error?.json) return error.json();
    return failResponse('INTERNAL_ERROR', 'Failed to update payment receipt', 500);
  }
}
