import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminOrderById } from '@/server/services/admin-order.service';
import { handleApiError } from '@/lib/api/handleApiError';

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
  } catch (error) {
    return handleApiError(error);
  }
}
