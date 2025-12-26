import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminOrderById } from '@/server/services/admin-order.service';

export const dynamic = 'force-dynamic';

/**
 * Admin order detail API
 * GET /api/admin/orders/:id
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const order = await getAdminOrderById(params?.id);
    return okResponse(order);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch order', 500);
  }
}
