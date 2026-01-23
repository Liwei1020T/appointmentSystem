import { describe, expect, it } from 'vitest';
import { normalizeVoucher } from '@/services/adminVoucherService';

describe('normalizeVoucher', () => {
  it('maps first-order and auto-issue flags', () => {
    const result = normalizeVoucher({
      id: 'v-1',
      code: 'WELCOME5',
      type: 'fixed_amount',
      value: 5,
      isAutoIssue: true,
      isFirstOrderOnly: true,
      validityDays: 7,
    });

    expect(result.isAutoIssue).toBe(true);
    expect(result.isFirstOrderOnly).toBe(true);
    expect(result.validityDays).toBe(7);
  });
});
