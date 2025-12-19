/**
 * 管理员登录页面组件 (Admin Login Page)
 * 
 * 功能：
 * - Phone + Password 登录表单（无邮箱）
 * - 角色验证（仅允许 admin/super_admin，通过 NextAuth authorize 校验）
 * - 登录成功后跳转到管理员仪表板
 * - 错误提示
 * - 记住我功能
 */

'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/services/authService';
import { normalizeMyPhone, validatePhone } from '@/lib/utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * 从 localStorage 读取记住的手机号
   */
  useEffect(() => {
    const savedPhone = localStorage.getItem('admin_remembered_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 基本验证
    const phoneValue = normalizeMyPhone(phone);
    setPhone(phoneValue);
    if (!phoneValue || !validatePhone(phoneValue)) {
      setError('请输入正确的手机号');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      setLoading(false);
      return;
    }

    try {
      // 使用 NextAuth Credentials 登录（admin=true 会在 authorize 中强制检查角色）
      await signIn({ phone: phoneValue, password: password.trim(), admin: true });

      // 处理 "记住我"
      if (rememberMe) {
        localStorage.setItem('admin_remembered_phone', phoneValue);
      } else {
        localStorage.removeItem('admin_remembered_phone');
      }

      // 登录成功，跳转到仪表板
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || '登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink-elevated to-ink-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ink-elevated rounded-full mb-4 shadow-lg border border-border-subtle">
            <span className="text-3xl">🏸</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">管理员登录</h1>
          <p className="text-text-secondary">String Service Platform - Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-ink-surface rounded-2xl shadow-2xl p-8 border border-border-subtle">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
                手机号
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(normalizeMyPhone(e.target.value))}
                className="w-full px-4 py-3 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="01131609008"
                disabled={loading}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
              />
              <p className="text-xs text-text-tertiary mt-2">可直接输入 01 开头手机号，无需填写 +60</p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-border-subtle rounded"
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                记住我
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/15 border border-danger/40 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-danger text-xl">⚠️</span>
                  <p className="text-sm text-danger font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-text-onAccent py-3 px-4 rounded-lg font-medium hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-text-onAccent border-t-transparent"></div>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <p className="text-xs text-center text-text-tertiary">
              仅限管理员访问 • Admin & Super Admin Only
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-tertiary">
            © 2025 String Service Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
