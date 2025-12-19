/**
 * 编辑个人资料页面 (Edit Profile Page)
 * 
 * 支持编辑姓名、电话、地址等基本信息
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getUserProfile,
  updateProfile,
  UserProfile,
  UpdateProfileParams,
} from '@/services/profileService';
import { Card, Spinner, Button, Toast, Input } from '@/components';
import AvatarUploader from '@/components/AvatarUploader';
import { normalizeMyPhone } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UpdateProfileParams>({
    full_name: '',
    phone: '',
    address: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 加载用户资料
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);

    try {
      const { profile: data, error } = await getUserProfile();

      if (error) {
        setToast({
          show: true,
          message: error?.message || error || '加载失败',
          type: 'error',
        });
      } else if (data) {
        setProfile(data);
        const resolvedName = data.fullName || data.full_name || '';
        setFormData({
          full_name: resolvedName,
          phone: data.phone || '',
          address: data.address || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '加载失败',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理表单变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? normalizeMyPhone(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = '姓名至少2个字符';
    }

    if (formData.phone && !/^(\+?6?01)[0-9]{8,9}$/.test(formData.phone)) {
      newErrors.phone = '请输入有效的马来西亚手机号码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile(formData);

      if (error) {
        setToast({
          show: true,
          message: error || '更新失败',
          type: 'error',
        });
      } else {
        setToast({
          show: true,
          message: '资料已更新',
          type: 'success',
        });
        // 1秒后返回
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '更新失败',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">编辑资料</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 头像上传 */}
          <Card>
            <div className="p-6">
              <AvatarUploader
                userId={user.id}
                currentAvatarUrl={formData.avatar_url}
                userName={formData.full_name}
                size="lg"
                editable={true}
                onUploadSuccess={(url) => {
                  setFormData((prev) => ({ ...prev, avatar_url: url }));
                  setToast({
                    show: true,
                    message: '头像上传成功',
                    type: 'success',
                  });
                }}
                onUploadError={(error) => {
                  setToast({
                    show: true,
                    message: error || '头像上传失败',
                    type: 'error',
                  });
                }}
                onDelete={() => {
                  setFormData((prev) => ({ ...prev, avatar_url: '' }));
                  setToast({
                    show: true,
                    message: '头像已删除',
                    type: 'info',
                  });
                }}
              />
            </div>
          </Card>

          {/* 姓名 */}
          <Card>
            <div className="p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                姓名 <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="请输入姓名"
                error={errors.full_name}
              />
            </div>
          </Card>

          {/* 电话 */}
          <Card>
            <div className="p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                电话号码
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="例如：01131609008"
                inputMode="numeric"
                pattern="[0-9]*"
                error={errors.phone}
              />
              <p className="text-xs text-slate-500 mt-2">
                可直接输入 01 开头手机号，无需填写 +60
              </p>
            </div>
          </Card>

          {/* 地址 */}
          <Card>
            <div className="p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                地址
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="请输入地址（可选）"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                rows={3}
              />
            </div>
          </Card>

          {/* 提交按钮 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => router.back()}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={saving}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </form>
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
