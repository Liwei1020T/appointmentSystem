import { describe, expect, it } from 'vitest';

import { normalizeStoredUploadPath } from '@/lib/upload';

describe('normalizeStoredUploadPath', () => {
  it('strips leading slash and upload directory prefix', () => {
    expect(normalizeStoredUploadPath('/uploads/payment-proofs/proof.jpg')).toBe('payment-proofs/proof.jpg');
  });

  it('keeps relative paths that already omit upload directory prefix', () => {
    expect(normalizeStoredUploadPath('payment-proofs/proof.jpg')).toBe('payment-proofs/proof.jpg');
  });

  it('normalizes windows separators and strips upload directory prefix', () => {
    expect(normalizeStoredUploadPath('\\uploads\\avatars\\profile.webp')).toBe('avatars/profile.webp');
  });

  it('maps upload root path to empty relative path', () => {
    expect(normalizeStoredUploadPath('/uploads')).toBe('');
  });
});
