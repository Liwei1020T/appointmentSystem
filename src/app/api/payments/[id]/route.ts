import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { getPaymentForUser } from '@/server/services/payment.service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params?.id;

    if (!isValidUUID(paymentId)) {
      return failResponse('BAD_REQUEST', 'Invalid payment id', 400);
    }

    const payment = await getPaymentForUser({ paymentId, user });
    return okResponse(payment);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    if (error?.json) return error.json();
    return failResponse('INTERNAL_ERROR', 'Failed to fetch payment', 500);
  }
}
