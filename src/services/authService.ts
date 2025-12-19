/**
 * Auth Service - Alias
 * Re-export from auth.service.ts
 */

export * from './auth.service';

// Re-export profile functions for backward compatibility
export { updateProfile } from './profile.service';

/**
 * 更新密码（已登录用户）
 *
 * Phone + Password 模式下允许用户修改密码。
 */
export async function updatePassword(data: {
  currentPassword?: string;
  newPassword: string;
} | string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordData =
      typeof data === 'string'
        ? { newPassword: data }
        : data;

    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: 'Failed to update password' };
  }
}
