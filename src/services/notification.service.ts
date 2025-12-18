/**
 * Notification Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

export interface NotificationData {
  /**
   * Normalized notification objects for UI components.
   * Notes:
   * - Backend (Prisma) uses `read`, `createdAt`.
   * - UI legacy expects `is_read`, `created_at`.
   */
  notifications: Array<{
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string | null;
    priority?: string | null;
    // Prisma fields
    read: boolean;
    createdAt: string | Date;
    // Legacy aliases for UI
    is_read: boolean;
    created_at: string | Date;
  }>;
  unreadCount: number;
}

/**
 * Convert backend notifications into the UI's legacy-friendly shape.
 */
function normalizeNotification(raw: any) {
  const read = Boolean(raw?.read ?? raw?.is_read ?? false);
  const createdAt = raw?.createdAt ?? raw?.created_at ?? new Date().toISOString();
  return {
    ...raw,
    read,
    createdAt,
    is_read: read,
    created_at: createdAt,
  };
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

  const payload = data?.data ?? data;
  return {
    unreadCount: Number(payload?.unreadCount ?? 0) || 0,
    notifications: Array.isArray(payload?.notifications)
      ? payload.notifications.map(normalizeNotification)
      : [],
  };
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
