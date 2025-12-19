/**
 * 个人资料页面组件 (Profile Page)
 * 
 * 功能：
 * - 显示用户基本信息
 * - 显示我的邀请码（可复制）
 * - 编辑个人资料（姓名、手机号）
 * - 修改密码（已登录用户）
 * - 退出登录
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Badge, Toast, Spinner } from '@/components';
import { useSession, signOut } from 'next-auth/react';
import { updateProfile, updatePassword } from '@/services/authService';
import { normalizeMyPhone, validatePassword, validatePhone } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';

  // 表单状态
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  // UI 状态
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  /**
   * 从用户信息加载表单数据
   */
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  /**
   * 如果未登录，跳转到登录页
   */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  /**
   * 复制邀请码
   */
  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setToast({
        show: true,
        message: '邀请码已复制！(Referral code copied!)',
        type: 'success',
      });
    }
  };

  /**
   * 处理资料输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? normalizeMyPhone(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * 处理密码输入变化
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * 验证资料表单
   */
  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = '请输入姓名 (Name is required)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号 (Phone is required)';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '手机号格式不正确 (Invalid phone format)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 保存资料
   */
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    setLoading(true);

    try {
      const { error } = await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
      });

      if (error) {
        setToast({
          show: true,
          message: typeof error === 'string' ? error : (error as any)?.message || '更新失败 (Update failed)',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // 刷新用户信息
      await update();

      setToast({
        show: true,
        message: '资料已更新！(Profile updated!)',
        type: 'success',
      });
      setEditMode(false);
      setLoading(false);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '更新失败 (Update failed)',
        type: 'error',
      });
      setLoading(false);
    }
  };

  /**
   * 修改密码
   */
  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = '请输入新密码 (New password is required)';
    } else if (!validatePassword(passwordData.newPassword)) {
      newErrors.newPassword = '密码至少8位，包含大小写字母和数字';
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码 (Confirm password is required)';
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      newErrors.confirmPassword = '两次密码不一致 (Passwords do not match)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const { success, error } = await updatePassword({
        currentPassword: passwordData.currentPassword || undefined,
        newPassword: passwordData.newPassword,
      });

      if (!success || error) {
        setToast({
          show: true,
          message: error || '修改失败 (Update failed)',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      setToast({
        show: true,
        message: '密码已更新！(Password updated!)',
        type: 'success',
      });
      setChangePasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLoading(false);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '修改失败 (Update failed)',
        type: 'error',
      });
      setLoading(false);
    }
  };

  /**
   * 退出登录
   */
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 用户信息卡片 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">个人资料</h2>
              <Badge variant="blue">
                {user.role === 'admin' ? '管理员' : '用户'}
              </Badge>
            </div>

            {editMode ? (
              /* 编辑模式 */
              <div className="space-y-4">
                <Input
                  label="姓名 Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                />

                <Input
                  label="手机号 Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="01131609008"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  helperText="可直接输入 01 开头手机号（例如 01131609008）"
                />

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    loading={loading}
                    disabled={loading}
                  >
                    保存
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        fullName: user.full_name || '',
                        phone: user.phone || '',
                      });
                      setErrors({});
                    }}
                    disabled={loading}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              /* 查看模式 */
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">姓名</label>
                  <p className="mt-1 text-text-primary">{user.full_name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-secondary">手机号</label>
                  <p className="mt-1 text-text-primary">{user.phone}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-secondary">当前积分</label>
                  <p className="mt-1 text-text-primary font-semibold text-lg">
                    {user.points} 分
                  </p>
                </div>

                <Button variant="secondary" onClick={() => setEditMode(true)}>
                  编辑资料
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 邀请码卡片 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">我的邀请码</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-ink-elevated rounded-lg px-4 py-3 border border-border-subtle">
                <p className="text-2xl font-mono font-bold text-accent text-center">
                  {user.referral_code}
                </p>
              </div>
              <Button variant="secondary" onClick={copyReferralCode}>
                复制
              </Button>
            </div>
            <p className="text-sm text-text-secondary mt-3">
              邀请朋友注册，双方各得 50 积分！
            </p>
          </div>
        </Card>

        {/* 登录方式说明 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">修改密码</h3>

            {changePasswordMode ? (
              <div className="space-y-4">
                <Input
                  label="当前密码 Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="如未设置可留空"
                  error={errors.currentPassword}
                />

                <Input
                  label="新密码 New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={errors.newPassword}
                  placeholder="至少8位"
                />

                <Input
                  label="确认新密码 Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={errors.confirmPassword}
                  placeholder="再次输入新密码"
                />

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleChangePassword}
                    loading={loading}
                    disabled={loading}
                  >
                    确认修改
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setErrors({});
                    }}
                    disabled={loading}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setChangePasswordMode(true)}>
                修改密码
              </Button>
            )}
          </div>
        </Card>

        {/* 退出登录 */}
        <Card>
          <div className="p-6">
            <Button variant="danger" fullWidth onClick={handleSignOut}>
              退出登录
            </Button>
          </div>
        </Card>
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
