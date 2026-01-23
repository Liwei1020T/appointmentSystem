import { describe, expect, it } from 'vitest';
import { parseValidityDays } from '@/lib/voucher-utils';

describe('parseValidityDays', () => {
  it('returns null for empty input', () => {
    expect(parseValidityDays(null)).toBeNull();
    expect(parseValidityDays(undefined)).toBeNull();
    expect(parseValidityDays('')).toBeNull();
  });

  it('parses numeric input', () => {
    expect(parseValidityDays('7')).toBe(7);
    expect(parseValidityDays(14)).toBe(14);
  });

  it('returns NaN for invalid numbers', () => {
    const result = parseValidityDays('invalid');
    expect(Number.isNaN(result as number)).toBe(true);
  });
});
