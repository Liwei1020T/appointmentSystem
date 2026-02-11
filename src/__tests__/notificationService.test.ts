import { describe, expect, it } from 'vitest';
import { normalizeNotification } from '@/services/notificationService';

describe('normalizeNotification', () => {
  it('maps snake_case payload into normalized notification fields', () => {
    const normalized = normalizeNotification({
      id: 'notif-1',
      user_id: 'user-1',
      title: '订单更新',
      message: '您的订单已完成',
      type: 'order',
      is_read: true,
      created_at: '2026-02-11T00:00:00.000Z',
      action_url: '/orders/1',
      priority: 'high',
    });

    expect(normalized.id).toBe('notif-1');
    expect(normalized.userId).toBe('user-1');
    expect(normalized.user_id).toBe('user-1');
    expect(normalized.read).toBe(true);
    expect(normalized.is_read).toBe(true);
    expect(normalized.createdAt).toBe('2026-02-11T00:00:00.000Z');
    expect(normalized.created_at).toBe('2026-02-11T00:00:00.000Z');
    expect(normalized.actionUrl).toBe('/orders/1');
    expect(normalized.action_url).toBe('/orders/1');
    expect(normalized.priority).toBe('high');
  });

  it('returns safe defaults for unknown payload', () => {
    const normalized = normalizeNotification(null);

    expect(normalized.id).toBe('');
    expect(normalized.userId).toBe('');
    expect(normalized.type).toBe('system');
    expect(normalized.read).toBe(false);
    expect(normalized.is_read).toBe(false);
    expect(typeof normalized.createdAt).toBe('string');
    expect(typeof normalized.created_at).toBe('string');
  });
});
