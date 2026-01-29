/**
 * Order photo delete API (admin only)
 * DELETE /api/orders/:id/photos/:photoId
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { deleteOrderPhoto } from '@/server/services/order-photos.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const admin = await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order photo id', 422, parsedParams.error.flatten());
    }

    await deleteOrderPhoto(admin, parsedParams.data.id, parsedParams.data.photoId);
    return okResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
