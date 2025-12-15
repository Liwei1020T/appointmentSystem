/**
 * Auth Service - NextAuth 迁移版本
 * 替代原来的 Supabase Auth 调用
 */

import { signIn, signOut } from 'next-auth/react';

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * 用户注册
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

// Alias for compatibility
export { signup as signUp };

/**
 * 用户登录
 */
export async function login(data: LoginData): Promise<any> {
  const result = await signIn('credentials', {
    redirect: false,
    email: data.email,
    password: data.password,
  });

  if (result?.error) {
    throw new Error('邮箱或密码错误');
  }

  return result;
}

// Alias for compatibility
export { login as signIn };

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
 * 重置密码
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || '重置密码失败' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || '重置密码失败' };
  }
}
