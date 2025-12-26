import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listPendingPayments } from '@/server/services/payment.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);

    const data = await listPendingPayments({ page, limit });
    return okResponse(data);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    if (error?.json) return error.json();
    return failResponse('INTERNAL_ERROR', 'Failed to fetch pending payments', 500);
  }
}
