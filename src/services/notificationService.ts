/**
 * Notification Service - 统一通知服务
 * Consolidated from notification.service.ts
 */

// Type exports for Notification components
export interface Notification {
  id: string;
  userId: string;
  user_id?: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
  action_url?: string | null;
  priority?: string | null;
  read: boolean;
  is_read: boolean;
  createdAt: string | Date;
  created_at: string | Date;
}

// Admin notification types
export interface NotificationLog {
  id: string;
  user_id: string;
  type: 'sms' | 'push';
  event_type: string;
  title?: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  error_message?: string | null;
  provider_response?: any;
  created_at: string;
  sent_at?: string | null;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  event_type: string;
  type: 'sms' | 'push' | 'both';
  sms_content?: string | null;
  push_title?: string | null;
  push_body?: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_sent: number;
  total_failed: number;
  sms_count: number;
  push_count: number;
  delivery_rate: number;
  by_event: { event_type: string; count: number }[];
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_type: 'ios' | 'android' | 'web';
  device_token: string;
  device_name?: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at?: string | null;
}

export interface NotificationData {
  /**
   * Normalized notification objects for UI components.
   * Notes:
   * - Backend (Prisma) uses `read`, `createdAt`.
   * - UI legacy expects `is_read`, `created_at`.
   */
  notifications: Notification[];
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

/**
 * Admin: 获取通知统计
 */
export async function getNotificationStats(days = 7): Promise<{ data: NotificationStats | null; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/notifications/stats?days=${days}`);
    const result = await response.json();
    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to fetch stats' };
    }
    return { data: result.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Admin: 获取所有通知记录
 */
export async function getAllNotifications(filters?: {
  type?: string;
  status?: string;
  event_type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<{ data: NotificationLog[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.event_type) params.append('event_type', filters.event_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await fetch(`/api/admin/notifications?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) {
      return { data: [], error: result.error || 'Failed to fetch notifications' };
    }
    return { data: result.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

/**
 * Admin: 获取所有通知模板
 */
export async function getAllTemplates(): Promise<{ data: NotificationTemplate[]; error: string | null }> {
  try {
    const response = await fetch('/api/admin/notifications/templates');
    const result = await response.json();
    if (!response.ok) {
      return { data: [], error: result.error || 'Failed to fetch templates' };
    }
    return { data: result.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

/**
 * Admin: 更新通知模板
 */
export async function updateTemplate(
  templateId: string,
  data: Partial<NotificationTemplate>
): Promise<void> {
  const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update template');
  }
}

/**
 * Admin: 测试通知
 */
export async function testNotification(
  userId: string,
  eventType: string,
  variables: Record<string, any>
): Promise<void> {
  const response = await fetch('/api/admin/notifications/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, eventType, variables }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to send test notification');
  }
}

/**
 * Admin: 获取用户设备列表
 */
export async function getUserDevices(userId?: string): Promise<{ data: UserDevice[]; error: string | null }> {
  try {
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`/api/admin/notifications/devices${params}`);
    const result = await response.json();
    if (!response.ok) {
      return { data: [], error: result.error || 'Failed to fetch devices' };
    }
    return { data: result.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}
