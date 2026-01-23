import { describe, expect, it } from 'vitest';
import { formatStatusLabel, validateOrderStatus } from '@/server/services/order-status.service';

describe('formatStatusLabel', () => {
  it('formats received status', () => {
    expect(formatStatusLabel('received')).toBe('已收拍');
  });
});

describe('validateOrderStatus', () => {
  it('rejects unknown status', () => {
    expect(validateOrderStatus('unknown')).toBe(false);
  });
});
