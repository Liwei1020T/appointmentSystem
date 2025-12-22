/**
 * Notification Service - 统一通知服务
 * Consolidated from notification.service.ts
 */

import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/actions/notifications.actions';

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
 * 获取通知图标
 */
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    order: '📦',
    package: '🎁',
    promo: '🎉',
    system: '⚙️',
    payment: '💰',
    points: '⭐',
    referral: '👥',
    sms: '📱',
    push: '🔔',
  };
  return icons[type] || '🔔';
}

/**
 * 获取通知颜色类
 */
export function getNotificationColor(typeOrPriority: string): string {
  const colors: Record<string, string> = {
    order: 'bg-info-soft text-info',
    package: 'bg-success/15 text-success',
    promo: 'bg-warning/15 text-warning',
    system: 'bg-ink-elevated text-text-secondary',
    payment: 'bg-accent/15 text-accent',
    points: 'bg-warning/15 text-warning',
    referral: 'bg-success/15 text-success',
    high: 'bg-danger/15 text-danger',
    medium: 'bg-warning/15 text-warning',
    low: 'bg-info-soft text-info',
  };
  return colors[typeOrPriority] || 'bg-ink-elevated text-text-secondary';
}

/**
 * 格式化通知时间
 */
export function formatNotificationTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
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
  const payload = await getNotificationsAction({ unreadOnly, limit });
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
  await markNotificationAsReadAction(notificationId);
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(): Promise<void> {
  await markAllNotificationsAsReadAction();
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
  await deleteNotificationAction(notificationId);
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
