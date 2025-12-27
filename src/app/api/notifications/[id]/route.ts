import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { deleteNotification } from '@/server/services/notification.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * Delete notification API
 * DELETE /api/notifications/:id
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const notificationId = params?.id;
    if (!isValidUUID(notificationId)) {
      return failResponse('BAD_REQUEST', 'Invalid notification id', 400);
    }

    await deleteNotification(user.id, notificationId);
    return okResponse({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
