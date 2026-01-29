import { describe, expect, it } from 'vitest';
import { isOrderOverdue } from '@/server/services/order-automation.service';

describe('isOrderOverdue', () => {
  it('flags overdue orders based on lastStatusChangeAt', () => {
    const overdue = isOrderOverdue({ lastStatusChangeAt: new Date('2025-01-01') }, 72);

    expect(overdue).toBe(true);
  });
});
