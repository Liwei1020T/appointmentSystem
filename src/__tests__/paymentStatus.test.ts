import { describe, expect, it } from 'vitest';
import { shouldAdvanceOrderStatus } from '@/server/services/payment.service';

describe('shouldAdvanceOrderStatus', () => {
  it('advances pending order after payment success', () => {
    expect(shouldAdvanceOrderStatus('pending', 'success')).toBe(true);
  });
});
