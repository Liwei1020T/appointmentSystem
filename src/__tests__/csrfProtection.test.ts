import { describe, expect, it } from 'vitest';

import { verifyCsrfRequest } from '@/lib/csrf';

describe('verifyCsrfRequest', () => {
  it('allows safe GET request without origin', () => {
    const request = new Request('https://example.com/api/orders', { method: 'GET' });
    const result = verifyCsrfRequest(request, { pathname: '/api/orders' });

    expect(result.allowed).toBe(true);
  });

  it('allows same-origin POST request', () => {
    const request = new Request('https://example.com/api/orders', {
      method: 'POST',
      headers: {
        origin: 'https://example.com',
      },
    });
    const result = verifyCsrfRequest(request, { pathname: '/api/orders' });

    expect(result.allowed).toBe(true);
  });

  it('allows same-origin referer when origin header is missing', () => {
    const request = new Request('https://example.com/api/orders', {
      method: 'POST',
      headers: {
        referer: 'https://example.com/booking',
      },
    });
    const result = verifyCsrfRequest(request, { pathname: '/api/orders' });

    expect(result.allowed).toBe(true);
  });

  it('blocks cross-origin POST request', () => {
    const request = new Request('https://example.com/api/orders', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
      },
    });
    const result = verifyCsrfRequest(request, { pathname: '/api/orders' });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('origin_mismatch');
  });

  it('blocks unsafe request without origin and referer', () => {
    const request = new Request('https://example.com/api/orders', {
      method: 'POST',
    });
    const result = verifyCsrfRequest(request, { pathname: '/api/orders' });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('missing_origin');
  });

  it('allows exempt callback path without origin', () => {
    const request = new Request('https://example.com/api/payments/tng/callback', {
      method: 'POST',
    });
    const result = verifyCsrfRequest(request, {
      pathname: '/api/payments/tng/callback',
      exemptPathPrefixes: ['/api/payments/tng/callback'],
    });

    expect(result.allowed).toBe(true);
  });

  it('allows trusted origin from allow-list', () => {
    const request = new Request('https://example.com/api/orders', {
      method: 'POST',
      headers: {
        origin: 'https://admin.example.com',
      },
    });
    const result = verifyCsrfRequest(request, {
      pathname: '/api/orders',
      trustedOrigins: ['https://admin.example.com'],
    });

    expect(result.allowed).toBe(true);
  });

  it('allows bearer-auth request without browser origin headers', () => {
    const request = new Request('https://example.com/api/cron/cleanup-orders', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });
    const result = verifyCsrfRequest(request, { pathname: '/api/cron/cleanup-orders' });

    expect(result.allowed).toBe(true);
  });
});
