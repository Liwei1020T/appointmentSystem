/**
 * Notification Service - 统一通知服务
 * Consolidated from notification.service.ts
 */

import { apiRequest } from '@/services/apiClient';

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

// User Notification Preferences
export interface NotificationPreferences {
  // Global Channels
  sms: boolean;
  push: boolean;

  // Push Settings
  push_enabled?: boolean;
  push_order_updates?: boolean;
  push_payment_updates?: boolean;
  push_promotions?: boolean;
  push_system?: boolean;

  // SMS Settings
  sms_enabled?: boolean;
  sms_order_updates?: boolean;
  sms_payment_updates?: boolean;

  // Legacy / Simplified
  orderUpdates?: boolean;
  promotions?: boolean;
  securityAlerts?: boolean;
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
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unread', 'true');
  if (limit) params.set('limit', String(limit));
  const payload = await apiRequest<{ notifications: Notification[]; unreadCount: number }>(
    `/api/notifications?${params.toString()}`
  );
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
  await apiRequest(`/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId }),
  });
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(): Promise<void> {
  await apiRequest(`/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAll: true }),
  });
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
  await apiRequest(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

/**
 * 重试失败的通知
 */
export async function retryFailedNotification(notificationId: string): Promise<void> {
  await apiRequest(`/api/admin/notifications/${notificationId}/retry`, {
    method: 'POST',
  });
}

/**
 * Admin: 获取通知统计
 */
export async function getNotificationStats(days = 7): Promise<{ data: NotificationStats | null; error: string | null }> {
  try {
    const result = await apiRequest<any>(`/api/admin/notifications/stats?days=${days}`);
    const payload = (result as any)?.data ?? result;
    return { data: payload as NotificationStats, error: null };
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
    const result = await apiRequest<any>(`/api/admin/notifications?${params.toString()}`);
    const payload = (result as any)?.data ?? result;
    return { data: Array.isArray(payload) ? payload : [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

/**
 * Admin: 获取所有通知模板
 */
export async function getAllTemplates(): Promise<{ data: NotificationTemplate[]; error: string | null }> {
  try {
    const result = await apiRequest<any>('/api/admin/notifications/templates');
    const payload = (result as any)?.data ?? result;
    return { data: Array.isArray(payload) ? payload : [], error: null };
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
  await apiRequest(`/api/admin/notifications/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Admin: 测试通知
 */
export async function testNotification(
  userId: string,
  eventType: string,
  variables: Record<string, any>
): Promise<void> {
  await apiRequest(`/api/admin/notifications/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, eventType, variables }),
  });
}

/**
 * Admin: 获取用户设备列表
 */
export async function getUserDevices(userId?: string): Promise<{ data: UserDevice[]; error: string | null }> {
  try {
    const params = userId ? `?userId=${userId}` : '';
    const result = await apiRequest<any>(`/api/admin/notifications/devices${params}`);
    const payload = (result as any)?.data ?? result;
    return { data: Array.isArray(payload) ? payload : [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

/**
 * 获取用户通知偏好设置 (Mocked)
 */
export async function getNotificationPreferences(): Promise<{ data: NotificationPreferences | null; error: string | null }> {
  // TODO: Implement backend endpoint for user preferences
  return {
    data: {
      sms: true,
      push: true,

      push_enabled: true,
      push_order_updates: true,
      push_payment_updates: true,
      push_promotions: true,
      push_system: true,

      sms_enabled: true,
      sms_order_updates: true,
      sms_payment_updates: true,

      orderUpdates: true,
      promotions: false,
      securityAlerts: true
    },
    error: null
  };
}

/**
 * 更新用户通知偏好设置 (Mocked)
 */
export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<{ success: boolean; error: string | null }> {
  // TODO: Implement backend endpoint for user preferences
  return { success: true, error: null };
}