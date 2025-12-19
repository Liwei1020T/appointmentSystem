/**
 * 注册页面组件 (Signup Page)
 * 
 * 功能：
 * - 用户注册表单（Phone + Password + 全名）
 * - 可选填写邀请码
 * - 表单验证（手机号格式、密码强度）
 * - 错误提示
 * - 注册成功后自动跳转首页
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Toast } from '@/components';
import { signIn, signUp } from '@/services/authService';
import { normalizeMyPhone, validatePassword, validatePhone } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 表单状态
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referralCode: '',
    password: '',
    confirmPassword: '',
  });

  // 从 URL 参数获取邀请码
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData((prev) => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Phone input: allow simple digit input like 01131609008 (no +60 needed)
    const nextValue = name === 'phone' ? normalizeMyPhone(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    
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

    // 验证全名
    if (!formData.fullName.trim()) {
      newErrors.fullName = '请输入姓名 (Name is required)';
    }

    // 验证手机号
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号 (Phone is required)';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '手机号格式不正确 (Invalid phone format)';
    }

    // 验证密码
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码 (Password is required)';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少8位，包含大小写字母和数字';
    }

    // 确认密码
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码 (Confirm password is required)';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = '两次密码不一致 (Passwords do not match)';
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
      // 手机号 + 密码注册
      await signUp({
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        referralCode: formData.referralCode || undefined,
      });

      // 注册后自动登录
      await signIn({ phone: formData.phone, password: formData.password });

      // 注册成功
      setToast({
        show: true,
        message: '注册成功！正在跳转... (Registration successful!)',
        type: 'success',
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '注册失败 (Registration failed)',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <Card className="w-full max-w-md border border-border-subtle bg-ink-surface/90">
        <div className="p-6">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary">创建账户</h1>
            <p className="text-sm text-text-secondary mt-1">Sign up for String Service</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 全名 */}
            <Input
              label="姓名 Full Name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="请输入您的姓名"
              required
            />

            {/* 手机号 */}
            <Input
              label="手机号 Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="01131609008"
              inputMode="numeric"
              pattern="[0-9]*"
              helperText="可直接输入 01 开头手机号（例如 01131609008），无需填写 +60"
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
              placeholder="至少8位，包含大小写字母和数字"
              helperText="至少8位，包含大小写字母和数字"
              required
            />

            {/* 确认密码 */}
            <Input
              label="确认密码 Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="再次输入密码"
              required
            />

            {/* 邀请码（可选） */}
            <Input
              label="邀请码 Referral Code (可选)"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="输入朋友的邀请码"
              helperText="使用邀请码双方可获得积分奖励（注册后自动发放）"
            />

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? '注册中...' : '立即注册'}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center text-sm text-text-secondary">
            已有账户？{' '}
            <Link href="/login" className="text-accent hover:text-accent/80 font-medium">
              立即登录
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
