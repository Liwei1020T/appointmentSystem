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

  it('returns null for invalid numbers', () => {
    // 修复：无效输入返回 null 而非 NaN，防止下游 NaN 污染
    expect(parseValidityDays('invalid')).toBeNull();
    expect(parseValidityDays('abc123')).toBeNull();
  });
});
