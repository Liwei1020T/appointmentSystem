/**
 * Notifications API
 * GET /api/notifications
 * POST /api/notifications
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/server/services/notification.service';
import { isValidUUID } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  unread: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const bodySchema = z.object({
  notificationId: z.string().trim().optional(),
  markAll: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const data = await getNotifications(user.id, {
      unreadOnly: Boolean(query.data.unread),
      limit: query.data.limit,
    });
    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const { notificationId, markAll } = parsed.data;
    if (markAll) {
      await markAllNotificationsAsRead(user.id);
    } else if (notificationId) {
      if (!isValidUUID(notificationId)) {
        return failResponse('BAD_REQUEST', 'Invalid notification id', 400);
      }
      await markNotificationAsRead(user.id, notificationId);
    } else {
      return failResponse('BAD_REQUEST', 'notificationId or markAll is required', 400);
    }

    return okResponse({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
