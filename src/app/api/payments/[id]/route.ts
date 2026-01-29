import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { getPaymentForUser } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';

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
  } catch (error) {
    return handleApiError(error);
  }
}
