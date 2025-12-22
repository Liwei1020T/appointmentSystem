'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

export interface NotificationsActionResult {
  notifications: any[];
  unreadCount: number;
}

/**
 * 获取通知列表（Server Action）
 * @param options.unreadOnly - 是否仅获取未读
 * @param options.limit - 返回数量上限
 */
export async function getNotificationsAction(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<NotificationsActionResult> {
  const user = await requireAuth();
  const unreadOnly = Boolean(options?.unreadOnly);
  const limit = options?.limit;

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    ...(limit ? { take: limit } : {}),
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return { notifications, unreadCount };
}

/**
 * 标记单条通知为已读（Server Action）
 */
export async function markNotificationAsReadAction(notificationId: string): Promise<void> {
  const user = await requireAuth();

  if (!notificationId) {
    throw new Error('缺少通知ID');
  }

  await prisma.notification.update({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });
}

/**
 * 标记全部通知为已读（Server Action）
 */
export async function markAllNotificationsAsReadAction(): Promise<void> {
  const user = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
}

/**
 * 删除通知（Server Action）
 */
export async function deleteNotificationAction(notificationId: string): Promise<void> {
  const user = await requireAuth();

  if (!notificationId) {
    throw new Error('缺少通知ID');
  }

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('通知不存在');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
}
