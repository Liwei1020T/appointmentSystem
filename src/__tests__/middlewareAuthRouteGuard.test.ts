import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

vi.mock('@/lib/csrf', () => ({
  verifyCsrfRequest: vi.fn(() => ({ allowed: true })),
}));

import { middleware } from '@/middleware';

function createRequest(pathname: string): NextRequest {
  const url = new URL(`https://example.com${pathname}`);
  return {
    nextUrl: url,
    url: url.toString(),
  } as unknown as NextRequest;
}

describe('middleware auth route guard', () => {
  beforeEach(() => {
    getTokenMock.mockReset();
  });

  it('does not redirect /login when token has no user id', async () => {
    getTokenMock.mockResolvedValue({
      sub: 'legacy-user-id',
      role: 'customer',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await middleware(createRequest('/login'));

    expect(response.headers.get('location')).toBeNull();
  });

  it('does not redirect /signup when token is expired', async () => {
    getTokenMock.mockResolvedValue({
      id: 'user-1',
      role: 'customer',
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    const response = await middleware(createRequest('/signup'));

    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects valid logged-in user from /login to home', async () => {
    getTokenMock.mockResolvedValue({
      id: 'user-1',
      role: 'customer',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await middleware(createRequest('/login'));

    expect(response.headers.get('location')).toBe('https://example.com/');
  });
});
