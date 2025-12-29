/**
 * 通知设置页面 (Notification Settings Page)
 * 
 * 功能：
 * - 配置邮件通知偏好
 * - 配置推送通知偏好
 * - SMS 通知设置（未来功能）
 * - 实时保存
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Mail, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/services/notificationService';
import WebPushSubscription from '@/components/WebPushSubscription';
import PageLoading from '@/components/loading/PageLoading';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences(session.user.id);
    }
  }, [session?.user?.id]);

  const loadPreferences = async (userId: string) => {
    setLoading(true);
    const { data: prefs } = await getNotificationPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!session?.user?.id || !preferences) return;

    setSaving(true);
    setSaved(false);

    await updateNotificationPreferences(preferences);

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  if (loading) {
    return <PageLoading surface="dark" />;
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <p className="text-danger">加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">通知设置</h1>
          <p className="text-text-secondary">管理您的通知偏好和接收方式</p>
        </div>

        {/* 邮件通知 */}
        <div className="bg-ink-surface rounded-lg shadow-sm border border-border-subtle mb-6">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-text-primary">邮件通知</h2>
            </div>
            <p className="text-sm text-text-secondary">通过电子邮件接收通知</p>
          </div>

          <div className="p-6 space-y-4">
            {/* 总开关 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">启用邮件通知</h3>
                <p className="text-sm text-text-secondary">接收所有邮件通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={() => handleToggle('email_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ink-elevated peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink-surface after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            <hr className="border-border-subtle" />

            {/* 细分选项 */}
            <div className="space-y-3 opacity-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">订单更新</h4>
                  <p className="text-xs text-text-tertiary">订单状态变更通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_order_updates}
                  onChange={() => handleToggle('email_order_updates')}
                  disabled={!preferences.email_enabled}
                  className="w-4 h-4 text-accent bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">支付更新</h4>
                  <p className="text-xs text-text-tertiary">支付确认、拒绝通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_payment_updates}
                  onChange={() => handleToggle('email_payment_updates')}
                  disabled={!preferences.email_enabled}
                  className="w-4 h-4 text-accent bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">促销活动</h4>
                  <p className="text-xs text-text-tertiary">优惠券、活动通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_promotions}
                  onChange={() => handleToggle('email_promotions')}
                  disabled={!preferences.email_enabled}
                  className="w-4 h-4 text-accent bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">系统通知</h4>
                  <p className="text-xs text-text-tertiary">重要系统公告</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_system}
                  onChange={() => handleToggle('email_system')}
                  disabled={!preferences.email_enabled}
                  className="w-4 h-4 text-accent bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 推送通知 */}
        <div className="bg-ink-surface rounded-lg shadow-sm border border-border-subtle mb-6">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-6 h-6 text-info" />
              <h2 className="text-xl font-semibold text-text-primary">推送通知</h2>
            </div>
            <p className="text-sm text-text-secondary">通过浏览器推送接收通知</p>
          </div>

          <div className="p-6 space-y-4">
            {/* 总开关 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">启用推送通知</h3>
                <p className="text-sm text-text-secondary">接收浏览器推送通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={() => handleToggle('push_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ink-elevated peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink-surface after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info"></div>
              </label>
            </div>

            <hr className="border-border-subtle" />

            {/* 细分选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">订单更新</h4>
                  <p className="text-xs text-text-tertiary">订单状态变更通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_order_updates}
                  onChange={() => handleToggle('push_order_updates')}
                  disabled={!preferences.push_enabled}
                  className="w-4 h-4 text-info bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">支付更新</h4>
                  <p className="text-xs text-text-tertiary">支付确认、拒绝通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_payment_updates}
                  onChange={() => handleToggle('push_payment_updates')}
                  disabled={!preferences.push_enabled}
                  className="w-4 h-4 text-info bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">促销活动</h4>
                  <p className="text-xs text-text-tertiary">优惠券、活动通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_promotions}
                  onChange={() => handleToggle('push_promotions')}
                  disabled={!preferences.push_enabled}
                  className="w-4 h-4 text-info bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">系统通知</h4>
                  <p className="text-xs text-text-tertiary">重要系统公告</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_system}
                  onChange={() => handleToggle('push_system')}
                  disabled={!preferences.push_enabled}
                  className="w-4 h-4 text-info bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>
            </div>

            <hr className="border-border-subtle" />

            {/* Web Push 订阅管理 */}
            <div className="mt-4">
              <WebPushSubscription />
            </div>
          </div>
        </div>

        {/* SMS 通知 */}
        <div className="bg-ink-surface rounded-lg shadow-sm border border-border-subtle mb-6">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-6 h-6 text-success" />
              <h2 className="text-xl font-semibold text-text-primary">SMS 通知</h2>
            </div>
            <p className="text-sm text-text-secondary">通过短信接收重要通知（马来西亚号码）</p>
          </div>

          <div className="p-6 space-y-4">
            {/* 总开关 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">启用 SMS 通知</h3>
                <p className="text-sm text-text-secondary">接收短信通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  onChange={() => handleToggle('sms_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ink-elevated peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ink-surface after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
              </label>
            </div>

            <hr className="border-border-subtle" />

            {/* 细分选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">订单更新</h4>
                  <p className="text-xs text-text-tertiary">订单完成通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_order_updates}
                  onChange={() => handleToggle('sms_order_updates')}
                  disabled={!preferences.sms_enabled}
                  className="w-4 h-4 text-success bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary">支付更新</h4>
                  <p className="text-xs text-text-tertiary">支付确认通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_payment_updates}
                  onChange={() => handleToggle('sms_payment_updates')}
                  disabled={!preferences.sms_enabled}
                  className="w-4 h-4 text-success bg-ink-surface border-border-subtle rounded focus:ring-accent-border disabled:opacity-50"
                />
              </div>
            </div>

            <hr className="border-border-subtle" />

            {/* 提示信息 */}
            <div className="bg-success/10 border border-border-subtle rounded-lg p-4">
              <p className="text-xs text-text-secondary">
                💡 SMS 仅用于重要通知（订单完成、支付确认），不会用于促销。
                <br />
                费率：约 RM 0.30/条（Twilio）
              </p>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-between bg-ink-surface rounded-lg border border-border-subtle p-4">
          <div>
            {saved && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">设置已保存</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent text-text-onAccent rounded-lg font-medium transition-colors hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" tone="inverse" className="w-4 h-4" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>保存设置</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
