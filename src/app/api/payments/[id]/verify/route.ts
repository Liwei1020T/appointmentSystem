import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { verifyPayment } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  transactionId: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const paymentId = params?.id;

    if (!isValidUUID(paymentId)) {
      return failResponse('BAD_REQUEST', 'Invalid payment id', 400);
    }

    const parsed = await parseJson(request, bodySchema, { allowEmpty: true });
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

    const payment = await verifyPayment({
      paymentId,
      admin,
      transactionId: parsed.data.transactionId ?? undefined,
      notes: parsed.data.notes ?? undefined,
    });

    return okResponse({ paymentId: payment.id, status: payment.status });
  } catch (error) {
    return handleApiError(error);
  }
}
