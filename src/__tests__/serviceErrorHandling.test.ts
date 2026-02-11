import { describe, expect, it, vi } from 'vitest';

import { adminLogin } from '@/services/adminAuthService';
import { updatePassword } from '@/services/authService';
import { completeOrder } from '@/services/completeOrderService';
import { uploadImage } from '@/services/imageUploadService';
import { getPointsBalance } from '@/services/pointsService';

describe('service error handling', () => {
  it('preserves thrown string for updatePassword', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Password API unavailable'));

    const result = await updatePassword('new-password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Password API unavailable');
    vi.unstubAllGlobals();
  });

  it('preserves thrown string for getPointsBalance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Points API unavailable'));

    const result = await getPointsBalance();

    expect(result.balance).toBe(0);
    expect(result.error).toBe('Points API unavailable');
    vi.unstubAllGlobals();
  });

  it('preserves thrown string for completeOrder', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Complete order failed'));

    const result = await completeOrder('order-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Complete order failed');
    vi.unstubAllGlobals();
  });

  it('preserves thrown string for uploadImage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Upload endpoint down'));

    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const result = await uploadImage(file, 'uploads');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Upload endpoint down');
    vi.unstubAllGlobals();
  });

  it('preserves thrown string for adminLogin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Admin auth unavailable'));

    const result = await adminLogin('admin@example.com', 'secret');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin auth unavailable');
    vi.unstubAllGlobals();
  });
});
