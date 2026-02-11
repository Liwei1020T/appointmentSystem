import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const apiLimiterCheckMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock('@/lib/server-auth', () => ({
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {
    check: (...args: unknown[]) => apiLimiterCheckMock(...args),
  },
  getClientIp: (...args: unknown[]) => getClientIpMock(...args),
  rateLimitResponse: (resetAt: number) =>
    new Response(JSON.stringify({ success: false, resetAt }), { status: 429 }),
}));

const validOrderId = '11111111-1111-4111-8111-111111111111';
const validPhotoId = '22222222-2222-4222-8222-222222222222';

describe('order photo routes rate limit', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminMock.mockReset();
    apiLimiterCheckMock.mockReset();
    getClientIpMock.mockReset();

    requireAdminMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    getClientIpMock.mockReturnValue('127.0.0.1');
    apiLimiterCheckMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });
  });

  it('limits adding order photo', async () => {
    const { POST } = await import('@/app/api/orders/[id]/photos/route');
    const response = await POST(
      new Request(`http://localhost/api/orders/${validOrderId}/photos`, { method: 'POST', body: '{}' }),
      { params: { id: validOrderId } }
    );

    expect(response.status).toBe(429);
    expect(apiLimiterCheckMock).toHaveBeenCalledWith('order-photo:add:admin-1:127.0.0.1');
  });

  it('limits deleting order photo', async () => {
    const { DELETE } = await import('@/app/api/orders/[id]/photos/[photoId]/route');
    const response = await DELETE(
      new Request(`http://localhost/api/orders/${validOrderId}/photos/${validPhotoId}`, { method: 'DELETE' }),
      { params: { id: validOrderId, photoId: validPhotoId } }
    );

    expect(response.status).toBe(429);
    expect(apiLimiterCheckMock).toHaveBeenCalledWith('order-photo:delete:admin-1:127.0.0.1');
  });

  it('limits reordering order photos', async () => {
    const { POST } = await import('@/app/api/orders/[id]/photos/reorder/route');
    const response = await POST(
      new Request(`http://localhost/api/orders/${validOrderId}/photos/reorder`, { method: 'POST', body: '{}' }),
      { params: { id: validOrderId } }
    );

    expect(response.status).toBe(429);
    expect(apiLimiterCheckMock).toHaveBeenCalledWith('order-photo:reorder:admin-1:127.0.0.1');
  });
});
