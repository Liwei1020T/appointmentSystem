import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';

interface NotificationQuery {
  unreadOnly?: boolean;
  limit?: number;
}

/**
 * Fetch notifications plus unread count.
 */
export async function getNotifications(userId: string, options?: NotificationQuery) {
  const unreadOnly = Boolean(options?.unreadOnly);
  const limit = options?.limit ? Number(options.limit) : undefined;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (!isValidUUID(notificationId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid notification id');
  }

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError('NOT_FOUND', 404, 'Notification not found');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Delete a notification owned by the user.
 */
export async function deleteNotification(userId: string, notificationId: string) {
  if (!isValidUUID(notificationId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid notification id');
  }

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError('NOT_FOUND', 404, 'Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
}
