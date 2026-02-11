import { describe, expect, it } from 'vitest';

import { validateImageMagicBytes } from '@/lib/upload';

function bufferFromHex(hex: string) {
  return Buffer.from(hex.replace(/\s+/g, ''), 'hex');
}

describe('validateImageMagicBytes', () => {
  it('accepts jpeg signature for image/jpeg', () => {
    const jpegBuffer = bufferFromHex('ff d8 ff e0 00 10 4a 46 49 46');

    expect(() => validateImageMagicBytes(jpegBuffer, 'image/jpeg')).not.toThrow();
  });

  it('accepts jpeg signature for image/jpg alias', () => {
    const jpegBuffer = bufferFromHex('ff d8 ff e1 00 18 45 78 69 66');

    expect(() => validateImageMagicBytes(jpegBuffer, 'image/jpg')).not.toThrow();
  });

  it('rejects mismatched png mime with jpeg bytes', () => {
    const jpegBuffer = bufferFromHex('ff d8 ff e0 00 10 4a 46 49 46');

    expect(() => validateImageMagicBytes(jpegBuffer, 'image/png')).toThrow('File content does not match declared MIME type');
  });

  it('rejects unsupported image mime type', () => {
    const pngBuffer = bufferFromHex('89 50 4e 47 0d 0a 1a 0a 00 00');

    expect(() => validateImageMagicBytes(pngBuffer, 'image/bmp')).toThrow('Unsupported image MIME type');
  });
});
