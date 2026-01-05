import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { updateAdminOrderStatus } from '@/server/services/admin-order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.string().trim().min(1),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * Admin update order status API
 * PATCH /api/admin/orders/:id/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const order = await updateAdminOrderStatus(params?.id, parsed.data.status as any, parsed.data.notes);
    return okResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
