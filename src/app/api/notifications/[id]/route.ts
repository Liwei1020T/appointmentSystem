/**
 * Notification item API
 *
 * DELETE /api/notifications/:id
 *
 * Used by NotificationPanel delete action.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const notificationId = params.id;

    if (!notificationId) {
      return errorResponse('缺少通知ID', 400);
    }

    // Ensure the notification belongs to the current user
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return errorResponse('通知不存在', 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return successResponse({}, '删除成功');
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Delete notification error:', error);
    return errorResponse(error.message || '删除失败', 500);
  }
}

