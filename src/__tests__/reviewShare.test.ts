import { describe, expect, it } from 'vitest';
import { buildReviewShareMessage } from '@/lib/share';

describe('buildReviewShareMessage', () => {
  it('includes referral link in share message', () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://lwstringstudio.li-wei.net';

    const message = buildReviewShareMessage({ rating: 5 }, 'ABC123');

    expect(message).toContain('https://lwstringstudio.li-wei.net/signup?ref=ABC123');
    expect(message).toContain('评分 5★');

    process.env.NEXT_PUBLIC_APP_URL = originalBaseUrl;
  });
});
