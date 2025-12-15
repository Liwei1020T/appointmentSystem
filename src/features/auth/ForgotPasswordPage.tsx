/**
 * 忘记密码页面组件 (Forgot Password Page)
 * 
 * 功能：
 * - 发送密码重置邮件
 * - 表单验证（Email 格式）
 * - 成功提示用户检查邮箱
 * - 返回登录链接
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, Toast } from '@/components';
import { resetPassword } from '@/services/authService';
import { validateEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  // 表单状态
  const [email, setEmail] = useState('');

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('请输入邮箱 (Email is required)');
      return false;
    }

    if (!validateEmail(email)) {
      setError('邮箱格式不正确 (Invalid email format)');
      return false;
    }

    return true;
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
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setToast({
          show: true,
          message: typeof resetError === 'string' ? resetError : (resetError as any)?.message || '发送失败，请重试 (Failed to send reset email)',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // 成功发送重置邮件
      setSuccess(true);
      setToast({
        show: true,
        message: '重置邮件已发送，请检查您的邮箱 (Reset email sent!)',
        type: 'success',
      });
      setLoading(false);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '发送失败 (Failed to send reset email)',
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
            <h1 className="text-2xl font-bold text-slate-900">忘记密码</h1>
            <p className="text-sm text-slate-600 mt-1">Reset Your Password</p>
          </div>

          {success ? (
            /* 成功提示 */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 mr-3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-900">
                      邮件已发送！
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      我们已向 <strong>{email}</strong> 发送了密码重置邮件。
                      请检查您的邮箱（包括垃圾邮件文件夹），并点击邮件中的链接重置密码。
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/login">
                  <Button variant="primary" fullWidth>
                    返回登录
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* 表单 */
            <>
              <p className="text-sm text-slate-600 mb-6 text-center">
                输入您注册时使用的邮箱，我们将向您发送密码重置链接。
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 邮箱 */}
                <Input
                  label="邮箱 Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  error={error}
                  placeholder="example@mail.com"
                  required
                />

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? '发送中...' : '发送重置邮件'}
                </Button>
              </form>

              {/* 返回登录链接 */}
              <div className="mt-6 text-center text-sm text-slate-600">
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← 返回登录
                </Link>
              </div>
            </>
          )}
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
