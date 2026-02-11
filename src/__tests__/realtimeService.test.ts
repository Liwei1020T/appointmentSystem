import { describe, expect, it } from 'vitest';
import { extractOrderUpdatesFromPayload } from '@/services/realtimeService';

describe('extractOrderUpdatesFromPayload', () => {
  it('extracts updates from flat data array response', () => {
    const payload = {
      ok: true,
      data: [
        { id: 'order-1', status: 'pending', updatedAt: '2026-02-11T00:00:00.000Z' },
      ],
    };

    const updates = extractOrderUpdatesFromPayload(payload);

    expect(updates).toEqual([
      { orderId: 'order-1', status: 'pending', updatedAt: '2026-02-11T00:00:00.000Z' },
    ]);
  });

  it('extracts updates from nested data.orders response', () => {
    const payload = {
      ok: true,
      data: {
        orders: [
          { orderId: 'order-2', status: 'completed', updated_at: '2026-02-11T01:00:00.000Z' },
        ],
      },
    };

    const updates = extractOrderUpdatesFromPayload(payload);

    expect(updates).toEqual([
      { orderId: 'order-2', status: 'completed', updatedAt: '2026-02-11T01:00:00.000Z' },
    ]);
  });

  it('filters invalid entries and falls back to current timestamp when updatedAt is missing', () => {
    const payload = {
      data: [
        { id: 'order-valid', status: 'in_progress' },
        { id: 'order-missing-status' },
        { status: 'pending' },
      ],
    };

    const updates = extractOrderUpdatesFromPayload(payload);

    expect(updates).toHaveLength(1);
    expect(updates[0].orderId).toBe('order-valid');
    expect(updates[0].status).toBe('in_progress');
    expect(typeof updates[0].updatedAt).toBe('string');
    expect(updates[0].updatedAt.length).toBeGreaterThan(0);
  });
});
