import { describe, expect, it } from 'vitest';

import {
  mapAdminStatusToProgressStatus,
  normalizeStatusLogs,
  pickRelevantPayment,
} from '@/lib/orderDetailUtils';

describe('orderDetailUtils', () => {
  it('prefers direct payment over payments array', () => {
    const result = pickRelevantPayment({
      payment: { id: 'p-direct', status: 'success' },
      payments: [{ id: 'p-legacy', status: 'pending' }],
    });

    expect(result?.id).toBe('p-direct');
  });

  it('selects latest non-failed payment from list', () => {
    const result = pickRelevantPayment({
      payments: [
        { id: 'p1', status: 'pending', created_at: '2026-02-01T10:00:00.000Z' },
        { id: 'p2', status: 'failed', created_at: '2026-02-02T10:00:00.000Z' },
        { id: 'p3', status: 'pending_verification', updated_at: '2026-02-03T10:00:00.000Z' },
      ],
    });

    expect(result?.id).toBe('p3');
  });

  it('normalizes status logs from mixed snake/camel fields', () => {
    const normalized = normalizeStatusLogs([
      { status: 'pending', created_at: '2026-02-01T10:00:00.000Z', notes: 'created' },
      { status: 'in_progress', createdAt: '2026-02-01T12:00:00.000Z', note: 'started' },
      { status: '', created_at: 'invalid' },
    ]);

    expect(normalized).toEqual([
      { status: 'pending', createdAt: '2026-02-01T10:00:00.000Z', note: 'created' },
      { status: 'in_progress', createdAt: '2026-02-01T12:00:00.000Z', note: 'started' },
    ]);
  });

  it('maps admin status to progress status', () => {
    expect(mapAdminStatusToProgressStatus('confirmed')).toBe('in_progress');
    expect(mapAdminStatusToProgressStatus('ready')).toBe('completed');
    expect(mapAdminStatusToProgressStatus('cancelled')).toBe('cancelled');
  });
});
