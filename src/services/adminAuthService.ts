/**
 * Admin Auth Service
 * Re-export from auth.service.ts for backward compatibility
 */

export * from './authService';

/**
 * 管理员登录
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Admin login failed' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Admin login failed' };
  }
}
