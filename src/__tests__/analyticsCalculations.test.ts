import { describe, expect, it } from 'vitest';
import { calculateLtv } from '@/server/services/analytics.service';

describe('calculateLtv', () => {
  it('calculates LTV as total revenue / unique users', () => {
    expect(calculateLtv(2000, 100)).toBe(20);
  });
});
