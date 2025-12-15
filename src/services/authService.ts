/**
 * Auth Service - Alias
 * Re-export from auth.service.ts
 */

export * from './auth.service';

// Re-export profile functions for backward compatibility
export { updateProfile } from './profile.service';

/**
 * 更新密码
 */
export async function updatePassword(data: {
  currentPassword?: string;
  newPassword: string;
} | string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordData = typeof data === 'string' 
      ? { newPassword: data } 
      : data;
      
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const result = await response.json();
      return { success: false, error: result.error || 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: 'Failed to update password' };
  }
}
