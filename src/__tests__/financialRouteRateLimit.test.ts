import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAuthMock = vi.fn();
const requireUserMock = vi.fn();
const requireAdminMock = vi.fn();
const financialLimiterCheckMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock('@/lib/server-auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  requireUser: (...args: unknown[]) => requireUserMock(...args),
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  financialLimiter: {
    check: (...args: unknown[]) => financialLimiterCheckMock(...args),
  },
  getClientIp: (...args: unknown[]) => getClientIpMock(...args),
  rateLimitResponse: (resetAt: number) =>
    new Response(JSON.stringify({ success: false, resetAt }), { status: 429 }),
}));

const validId = '11111111-1111-4111-8111-111111111111';

describe('financial routes rate limit', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAuthMock.mockReset();
    requireUserMock.mockReset();
    requireAdminMock.mockReset();
    financialLimiterCheckMock.mockReset();
    getClientIpMock.mockReset();

    requireAuthMock.mockResolvedValue({ id: 'user-1' });
    requireUserMock.mockResolvedValue({ id: 'user-2' });
    requireAdminMock.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    getClientIpMock.mockReturnValue('127.0.0.1');
    financialLimiterCheckMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });
  });

  it('limits payment creation endpoint', async () => {
    const { POST } = await import('@/app/api/payments/route');
    const response = await POST(new Request('http://localhost/api/payments', { method: 'POST', body: '{}' }));

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:create:user-1:127.0.0.1');
  });

  it('limits cash payment endpoint', async () => {
    const { POST } = await import('@/app/api/payments/cash/route');
    const response = await POST(new Request('http://localhost/api/payments/cash', { method: 'POST', body: '{}' }));

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:cash:user-1:127.0.0.1');
  });

  it('limits voucher redeem endpoint', async () => {
    const { POST } = await import('@/app/api/vouchers/redeem/route');
    const response = await POST(new Request('http://localhost/api/vouchers/redeem', { method: 'POST', body: '{}' }) as never);

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('voucher:redeem:user-2:127.0.0.1');
  });

  it('limits voucher redeem-with-points endpoint', async () => {
    const { POST } = await import('@/app/api/vouchers/redeem-with-points/route');
    const response = await POST(new Request('http://localhost/api/vouchers/redeem-with-points', { method: 'POST', body: '{}' }) as never);

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('voucher:redeem-with-points:user-2:127.0.0.1');
  });

  it('limits payment proof upload endpoint', async () => {
    const { POST } = await import('@/app/api/payments/[id]/proof/route');
    const response = await POST(
      new Request(`http://localhost/api/payments/${validId}/proof`, { method: 'POST' }) as never,
      { params: { id: validId } }
    );

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:proof:user-1:127.0.0.1');
  });

  it('limits payment receipt endpoint', async () => {
    const { POST } = await import('@/app/api/payments/[id]/receipt/route');
    const response = await POST(
      new Request(`http://localhost/api/payments/${validId}/receipt`, { method: 'POST', body: '{}' }),
      { params: { id: validId } }
    );

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:receipt:user-1:127.0.0.1');
  });

  it('limits legacy order creation endpoint', async () => {
    const { POST } = await import('@/app/api/orders/create/route');
    const response = await POST(new Request('http://localhost/api/orders/create', { method: 'POST', body: '{}' }));

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('order:create:user-1:127.0.0.1');
  });

  it('limits points redeem endpoint', async () => {
    const { POST } = await import('@/app/api/points/redeem/route');
    const response = await POST(new Request('http://localhost/api/points/redeem', { method: 'POST', body: '{}' }) as never);

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('points:redeem:user-2:127.0.0.1');
  });

  it('limits payment verify endpoint', async () => {
    const { POST } = await import('@/app/api/payments/[id]/verify/route');
    const response = await POST(
      new Request(`http://localhost/api/payments/${validId}/verify`, { method: 'POST', body: '{}' }) as never,
      { params: { id: validId } }
    );

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:verify:admin-1:127.0.0.1');
  });

  it('limits payment reject endpoint', async () => {
    const { POST } = await import('@/app/api/payments/[id]/reject/route');
    const response = await POST(
      new Request(`http://localhost/api/payments/${validId}/reject`, { method: 'POST', body: '{}' }),
      { params: { id: validId } }
    );

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('payment:reject:admin-1:127.0.0.1');
  });

  it('limits order complete endpoint', async () => {
    const { POST } = await import('@/app/api/orders/[id]/complete/route');
    const response = await POST(
      new Request(`http://localhost/api/orders/${validId}/complete`, { method: 'POST', body: '{}' }),
      { params: { id: validId } }
    );

    expect(response.status).toBe(429);
    expect(financialLimiterCheckMock).toHaveBeenCalledWith('order:complete:admin-1:127.0.0.1');
  });
});
