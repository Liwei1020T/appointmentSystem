/**
 * 忘记密码页面组件 (Forgot Password Page)
 * 
 * 功能：
 * - 通过手机号获取 OTP
 * - 输入 OTP + 新密码完成重置
 * - 重置完成后引导返回登录
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Toast } from '@/components';
import { confirmPasswordReset, requestPasswordResetOtp } from '@/services/authService';
import { normalizeMyPhone, validatePassword, validatePhone } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

export default function ForgotPasswordPage() {
  // Step: 1 request OTP, 2 confirm reset
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  /**
   * OTP 冷却倒计时（秒）
   */
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue =
      name === 'phone' || name === 'code' ? normalizeMyPhone(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Step 1: 获取验证码
   */
  const handleRequestCode = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号 (Phone is required)';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '手机号格式不正确 (Invalid phone format)';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;

    setSendingCode(true);
    try {
      const result = await requestPasswordResetOtp({ phone: formData.phone });
      setCooldownLeft(result.cooldownSeconds || 60);
      setStep(2);
      setToast({
        show: true,
        message: '验证码已发送（5 分钟内有效）',
        type: 'success',
      });
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '发送验证码失败',
        type: 'error',
      });
    } finally {
      setSendingCode(false);
    }
  };

  /**
   * Step 2: 确认重置密码
   */
  const handleConfirmReset = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim() || !validatePhone(formData.phone)) {
      newErrors.phone = '手机号格式不正确 (Invalid phone format)';
    }
    if (!formData.code.trim() || !/^[0-9]{6}$/.test(formData.code.trim())) {
      newErrors.code = '请输入 6 位数字验证码';
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '请输入新密码 (New password is required)';
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = '密码至少8位，包含大小写字母和数字';
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码 (Confirm password is required)';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = '两次密码不一致 (Passwords do not match)';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset({
        phone: formData.phone,
        code: formData.code,
        newPassword: formData.newPassword,
      });

      setToast({
        show: true,
        message: '密码已重置，请使用新密码登录',
        type: 'success',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '重置密码失败',
        type: 'error',
      });
      setSubmitting(false);
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
            <h1 className="text-3xl font-bold font-display mb-3">找回密码</h1>
            <p className="text-sm text-white/85 leading-relaxed">
              通过短信验证码完成重置。我们将确保您的账号安全与进度可追踪。
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {[
                step === 1 ? '先获取验证码' : '输入验证码并设置新密码',
                '验证码有效期 5 分钟',
                '支持手机快速登录',
              ].map((item) => (
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
              <h2 className="text-2xl font-bold text-text-primary font-display">重置密码</h2>
              <p className="text-sm text-text-secondary mt-1">
                {step === 1 ? '获取验证码后继续' : '输入验证码并设置新密码'}
              </p>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
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
                  helperText="可直接输入 01 开头手机号，无需填写 +60"
                  required
                />

                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  loading={sendingCode}
                  disabled={sendingCode || cooldownLeft > 0}
                  onClick={handleRequestCode}
                  glow
                >
                  {cooldownLeft > 0 ? `请稍候 ${cooldownLeft}s` : '获取重置验证码'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
                  required
                />

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Input
                      label="验证码 OTP"
                      name="code"
                      type="text"
                      value={formData.code}
                      onChange={handleChange}
                      error={errors.code}
                      placeholder="6 位数字"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRequestCode}
                    disabled={sendingCode || cooldownLeft > 0}
                    loading={sendingCode}
                  >
                    {cooldownLeft > 0 ? `${cooldownLeft}s` : '重发验证码'}
                  </Button>
                </div>

                <Input
                  label="新密码 New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  placeholder="至少8位，包含大小写字母和数字"
                  required
                />

                <Input
                  label="确认新密码 Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="再次输入密码"
                  required
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    disabled={submitting}
                    onClick={() => setStep(1)}
                  >
                    返回
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    loading={submitting}
                    disabled={submitting}
                    onClick={handleConfirmReset}
                  >
                    确认重置
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border-subtle text-center text-sm text-text-secondary">
              <Link href="/login" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                ← 返回登录
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
