import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { failResponse, okResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { recordPaymentProof } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { financialLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

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

    const clientIp = getClientIp(request);
    const rateLimitKey = `payment:receipt:${user.id}:${clientIp}`;
    const rateLimitResult = financialLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetAt);
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
  } catch (error) {
    return handleApiError(error);
  }
}
