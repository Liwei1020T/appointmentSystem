/**
 * Notification Service - Alias
 * Re-export from notification.service.ts
 */

export * from './notification.service';

export interface NotificationLog {
  id: string;
  userId: string;
  user_id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  message: string;
  body?: string;
  status: string;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  sent_at: Date | null;
  createdAt: Date;
  created_at: Date;
  read?: boolean;
  is_read?: boolean;
  read_at?: Date | null;
  priority?: 'low' | 'normal' | 'high' | string;
  title?: string;
  // Additional optional properties for compatibility
  event_type?: string;
  error_message?: string | null;
}

// Alias for backwards compatibility
export type Notification = NotificationLog;

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive: boolean;
  // Additional fields for SMS and Push notifications (both camelCase and snake_case for compatibility)
  sms_content?: string;
  push_title?: string;
  push_body?: string;
  is_active?: boolean;
  event_type?: string;
  eventType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  // Additional stats properties
  delivery_rate: number;
  sms_count: number;
  push_count: number;
  by_event?: { event_type: string; count: number }[];
  total_sent?: number;
  total_failed?: number;
}

/**
 * 获取所有通知（管理员）
 */
export async function getAllNotifications(
  page = 1,
  limit = 20
): Promise<{ data: any[]; total: number; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/notifications?page=${page}&limit=${limit}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: [], total: 0, error: data.error || 'Failed to fetch notifications' };
    }
    return { data: data.data || [], total: data.total || 0, error: null };
  } catch (error: any) {
    return { data: [], total: 0, error: error.message || 'Failed to fetch notifications' };
  }
}

/**
 * 获取所有通知模板
 */
export async function getAllTemplates(): Promise<{ data: NotificationTemplate[]; error: string | null }> {
  try {
    const response = await fetch('/api/admin/notifications/templates');
    const data = await response.json();
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch templates' };
    }
    return { data: data.data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch templates' };
  }
}

/**
 * 获取通知统计
 */
export async function getNotificationStats(days?: number): Promise<{ data: NotificationStats | null; error: string | null }> {
  try {
    const queryParams = days ? `?days=${days}` : '';
    const response = await fetch(`/api/admin/notifications/stats${queryParams}`);
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to fetch stats' };
    }
    return { data: data.data || null, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch stats' };
  }
}

/**
 * 更新通知模板
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<NotificationTemplate>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update template' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update template' };
  }
}

/**
 * 测试发送通知
 */
export async function testNotification(
  userId: string,
  eventType?: string,
  variables?: Record<string, unknown>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventType, variables }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send test notification' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send test notification' };
  }
}

/**
 * Retry a failed notification
 */
export async function retryFailedNotification(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/notifications/${notificationId}/retry`, {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to retry notification' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to retry notification' };
  }
}

/**
 * User Device interface
 */
export interface UserDevice {
  id: string;
  userId: string;
  user_id: string;
  deviceType: string;
  device_type: string;
  device_name?: string;
  deviceToken: string | null;
  pushSubscription: string | null;
  isActive: boolean;
  is_active: boolean;
  lastActiveAt: Date;
  last_active_at: Date;
  createdAt: Date;
  created_at: Date;
  updatedAt: Date;
  updated_at: Date;
  // Additional properties
  last_used_at?: Date | null;
  users?: { full_name: string };
}

/**
 * Get user devices
 */
export async function getUserDevices(): Promise<{ data: UserDevice[]; error: string | null }> {
  try {
    const response = await fetch('/api/admin/notifications/devices');
    const data = await response.json();
    if (!response.ok) {
      return { data: [], error: data.error || 'Failed to fetch devices' };
    }
    return { data: data.devices || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || 'Failed to fetch devices' };
  }
}

/**
 * 获取通知图标
 */
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    order: '📦',
    order_confirmed: '✅',
    order_completed: '🎉',
    order_cancelled: '❌',
    payment: '💳',
    referral: '👥',
    points: '⭐',
    voucher: '🎟️',
    system: '📢',
    reminder: '⏰',
    promotion: '🎁',
  };
  return icons[type] || '📬';
}

/**
 * 获取通知颜色
 */
export function getNotificationColor(type: string): string {
  const colors: Record<string, string> = {
    order: 'text-blue-600 bg-blue-50',
    order_confirmed: 'text-green-600 bg-green-50',
    order_completed: 'text-green-600 bg-green-50',
    order_cancelled: 'text-red-600 bg-red-50',
    payment: 'text-purple-600 bg-purple-50',
    referral: 'text-orange-600 bg-orange-50',
    points: 'text-yellow-600 bg-yellow-50',
    voucher: 'text-pink-600 bg-pink-50',
    system: 'text-gray-600 bg-gray-50',
    reminder: 'text-cyan-600 bg-cyan-50',
    promotion: 'text-red-600 bg-red-50',
  };
  return colors[type] || 'text-gray-600 bg-gray-50';
}

/**
 * 格式化通知时间
 */
export function formatNotificationTime(date: Date | string | null | undefined): string {
  if (!date) return '未知时间';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return d.toLocaleDateString('zh-CN');
}

/**
 * 通知偏好设置
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  // Extended snake_case options for component compatibility
  email_enabled?: boolean;
  email_order_updates?: boolean;
  email_payment_updates?: boolean;
  email_promotions?: boolean;
  email_reminders?: boolean;
  sms_enabled?: boolean;
  sms_order_updates?: boolean;
  sms_payment_updates?: boolean;
  push_enabled?: boolean;
  push_order_updates?: boolean;
  push_payment_updates?: boolean;
  push_promotions?: boolean;
  push_reminders?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * 获取通知偏好设置
 */
export async function getNotificationPreferences(): Promise<{ data: NotificationPreferences | null; error: string | null }> {
  try {
    const response = await fetch('/api/notifications/preferences');
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || '获取偏好设置失败' };
    }
    return { data: data.preferences || data.data || {
      email: true,
      sms: true,
      push: true,
      orderUpdates: true,
      promotions: true,
      reminders: true,
    }, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || '获取偏好设置失败' };
  }
}

/**
 * 更新通知偏好设置
 */
export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || '更新偏好设置失败' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || '更新偏好设置失败' };
  }
}
