/**
 * Auth Service - 统一认证服务
 * Consolidated from auth.service.ts + authService.ts
 *
 * Current auth mode:
 * - Phone number + password (no email)
 * - Forgot password: OTP verification + reset password
 */

import { signIn as nextAuthSignIn, signOut } from 'next-auth/react';

export interface SignupData {
  phone: string;
  fullName: string;
  referralCode?: string;
  password: string;
}

export interface LoginData {
  phone: string;
  password: string;
}

/**
 * 用户注册（手机号 + 密码）
 *
 * Data flow:
 * - Create user via API
 * - Then sign in via NextAuth credentials
 */
export async function signup(data: SignupData): Promise<any> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '注册失败');
  }

  return result.data;
}

/**
 * 用户登录（手机号 + 密码）
 *
 * @param data.phone - phone input (digits or +60)
 * @param data.password - account password
 */
export async function login(data: LoginData & { admin?: boolean }): Promise<any> {
  const result = await nextAuthSignIn('credentials', {
    redirect: false,
    phone: data.phone,
    password: data.password,
    admin: data.admin ? 'true' : 'false',
  });

  if (result?.error) {
    throw new Error(result.error || '手机号或密码错误');
  }

  return result;
}

// Aliases for backward compatibility with existing imports in UI
export { login as signIn };
export { signup as signUp };

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: true, callbackUrl: '/login' });
}

/**
 * 获取当前用户信息
 * 使用 useSession hook 替代
 */
export function getCurrentUser() {
  // 在组件中使用: const { data: session } = useSession();
  // session?.user 即为当前用户
  throw new Error('请在组件中使用 useSession hook 获取用户信息');
}

/**
 * 检查是否已登录
 * 使用 useSession hook 替代
 */
export function isAuthenticated() {
  // 在组件中使用: const { status } = useSession();
  // status === 'authenticated' 表示已登录
  throw new Error('请在组件中使用 useSession hook 检查登录状态');
}

/**
 * 获取重置密码验证码（SMS OTP）
 */
export async function requestPasswordResetOtp(data: {
  phone: string;
}): Promise<{ cooldownSeconds: number; devCode?: string }> {
  const response = await fetch('/api/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: data.phone, purpose: 'password_reset' }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || '发送验证码失败');
  }

  return result.data;
}

/**
 * 确认重置密码（OTP + 新密码）
 */
export async function confirmPasswordReset(data: {
  phone: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  const response = await fetch('/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || '重置密码失败');
  }
}

// Re-export profile functions for backward compatibility
export { updateProfile } from './profileService';

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
