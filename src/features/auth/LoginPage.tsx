/**
 * 登录页面组件 (Login Page)
 * 
 * 功能：
 * - 用户登录表单（Email + Password）
 * - 记住我选项（localStorage）
 * - 表单验证
 * - 错误提示
 * - 登录成功后自动跳转首页
 * - 忘记密码链接
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Toast, Checkbox } from '@/components';
import { signIn } from '@/services/authService';
import { validateEmail } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();

  // 表单状态
  const [formData, setFormData] = useState({
    email: '',
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
   * 从 localStorage 加载记住的邮箱
   */
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
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

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱 (Email is required)';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确 (Invalid email format)';
    }

    // 验证密码
    if (!formData.password) {
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
      // 正确调用方式：传递对象
      await signIn({
        email: formData.email,
        password: formData.password,
      });

      // 处理"记住我"
      if (formData.rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // 登录成功
      setToast({
        show: true,
        message: '登录成功！正在跳转... (Login successful!)',
        type: 'success',
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '邮箱或密码错误',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
            <p className="text-sm text-slate-600 mt-1">Login to String Service</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <Input
              label="邮箱 Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="example@mail.com"
              required
            />

            {/* 密码 */}
            <Input
              label="密码 Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="输入您的密码"
              required
            />

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <Checkbox
                label="记住我"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                忘记密码？
              </Link>
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? '登录中...' : '立即登录'}
            </Button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center text-sm text-slate-600">
            还没有账户？{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              立即注册
            </Link>
          </div>
        </div>
      </Card>

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
