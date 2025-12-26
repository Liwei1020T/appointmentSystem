import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { rejectPayment } from '@/server/services/payment.service';

const bodySchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
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

    await rejectPayment({ paymentId, reason: parsed.data.reason });
    return okResponse({ paymentId, status: 'rejected' });
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    if (error?.json) return error.json();
    return failResponse('INTERNAL_ERROR', 'Failed to reject payment', 500);
  }
}
