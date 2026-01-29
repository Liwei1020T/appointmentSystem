import { requireAdmin } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { listPendingPayments } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const data = await listPendingPayments({ page, limit });
    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
