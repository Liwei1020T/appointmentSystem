import { requireAdmin } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
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
