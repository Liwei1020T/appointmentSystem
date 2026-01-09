/**
 * 登录页面组件 (Login Page)
 * 
 * 功能：
 * - 用户登录表单（Phone + Password）
 * - 记住我选项（localStorage 记住手机号）
 * - 表单验证
 * - 错误提示
 * - 登录成功后自动跳转首页
 * - 忘记密码（OTP 重置）
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Toast, Checkbox } from '@/components';
import { getSession } from 'next-auth/react';
import { signIn } from '@/services/authService';
import { isAdminRole } from '@/lib/roles';
import { normalizeMyPhone, validatePhone } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();

  // 表单状态
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    rememberMe: false,
  });

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  /**
   * 从 localStorage 加载记住的手机号
   */
  useEffect(() => {
    const savedPhone = localStorage.getItem('remembered_phone');
    if (savedPhone) {
      setFormData((prev) => ({ ...prev, phone: savedPhone, rememberMe: true }));
    }
  }, []);

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === 'checkbox' ? checked : name === 'phone' ? normalizeMyPhone(value) : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // 清除对应字段的错误提示
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 验证手机号
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号 (Phone is required)';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '手机号格式不正确 (Invalid phone format)';
    }

    // 验证密码
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码 (Password is required)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证表单
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 使用手机号 + 密码登录
      await signIn({
        phone: formData.phone,
        password: formData.password,
      });

      // 处理"记住我"
      if (formData.rememberMe) {
        localStorage.setItem('remembered_phone', formData.phone);
      } else {
        localStorage.removeItem('remembered_phone');
      }

      // 登录成功
      setToast({
        show: true,
        message: '登录成功！正在跳转... (Login successful!)',
        type: 'success',
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(async () => {
        const session = await getSession();
        const role = (session?.user as any)?.role;
        const nextPath = isAdminRole(role) ? '/admin/dashboard' : '/dashboard';
        router.push(nextPath);
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '手机号或密码错误',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white border border-border-subtle rounded-3xl shadow-lg overflow-hidden animate-slide-up">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* Left: Brand Panel */}
          <div className="p-8 bg-gradient-to-br from-accent to-accent-alt text-white">
            <div className="flex items-center gap-3 mb-6">
              <BrandLogo size="md" className="shadow-glow" />
              <div className="text-sm uppercase tracking-[0.2em]">LW</div>
            </div>
            <h1 className="text-3xl font-bold font-display mb-3">欢迎回来</h1>
            <p className="text-sm text-white/85 leading-relaxed">
              专注于每一磅拉力，保持稳定与控制。登录后继续您的预约与订单管理。
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {['快速预约', '订单进度可视', '积分与优惠同步'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text-primary font-display">登录账户</h2>
              <p className="text-sm text-text-secondary mt-1">
                输入手机号与密码继续
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="手机号 Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="01131609008"
                inputMode="numeric"
                autoComplete="tel"
                pattern="[0-9]*"
                helperText="可直接输入 01 开头手机号，无需填写 +60"
                required
              />

              <Input
                label="密码 Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="输入您的密码"
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between">
                <Checkbox
                  label="记住我"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  忘记密码？
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
                glow
              >
                {loading ? '登录中...' : '立即登录'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border-subtle text-center text-sm text-text-secondary">
              还没有账户？{' '}
              <Link href="/signup" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
