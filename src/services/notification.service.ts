/**
 * Notification Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { Notification } from '.prisma/client';

export interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * 获取通知列表
 */
export async function getNotifications(
  unreadOnly = false,
  limit?: number
): Promise<NotificationData> {
  const params = new URLSearchParams();
  if (unreadOnly) params.append('unread', 'true');
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`/api/notifications?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取通知失败');
  }

  return data.data;
}

/**
 * 标记单个通知为已读
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notificationId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '标记失败');
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(): Promise<void> {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ markAll: true }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '标记失败');
  }
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(userId?: string): Promise<{ count: number }> {
  const data = await getNotifications(true);
  return { count: data.unreadCount };
}

/**
 * 删除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '删除失败');
  }
}

/**
 * 重试失败的通知
 */
export async function retryFailedNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/admin/notifications/${notificationId}/retry`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '重试失败');
  }
}
