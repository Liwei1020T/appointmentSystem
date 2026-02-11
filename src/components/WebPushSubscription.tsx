'use client';

/**
 * Web Push Subscription Component
 * 
 * 用户可以启用/禁用 Web Push 通知
 * - 显示订阅状态
 * - 请求通知权限
 * - 订阅/取消订阅
 * - 发送测试通知
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  isWebPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  sendTestNotification
} from '@/services/webPushService';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return fallback;
}

export default function WebPushSubscription() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查支持和状态
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    const isSupported = isWebPushSupported();
    setSupported(isSupported);

    if (!isSupported) {
      setError('您的浏览器不支持 Web Push 通知');
      return;
    }

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    const subscription = await getPushSubscription();
    setSubscribed(!!subscription);
  }

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const subscription = await subscribeToPush();
      if (subscription) {
        setSubscribed(true);
        setPermission('granted');
        alert('Web Push 通知已启用！');
      } else {
        throw new Error('订阅失败');
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, '订阅失败'));
      console.error('Subscribe error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setSubscribed(false);
        alert('已取消 Web Push 通知');
      } else {
        throw new Error('取消订阅失败');
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, '取消订阅失败'));
      console.error('Unsubscribe error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setLoading(true);
    setError(null);

    try {
      const success = await sendTestNotification();
      if (success) {
        alert('测试通知已发送！请查看系统通知。');
      } else {
        throw new Error('发送测试通知失败');
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, '发送失败'));
      console.error('Test notification error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="p-4 bg-ink-elevated rounded-lg border border-border-subtle">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-warning/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">不支持 Web Push</h3>
            <p className="text-sm text-text-secondary">
              您的浏览器不支持 Web Push 通知功能。
              <br />
              请使用 Chrome、Firefox、Edge 或 Safari 等现代浏览器。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-danger/15 rounded-lg border border-danger/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-danger/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <BellOff className="w-6 h-6 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-danger mb-1">通知权限被拒绝</h3>
            <p className="text-sm text-danger">
              您已拒绝通知权限。如需启用：
              <br />
              1. 点击地址栏的锁图标
              <br />
              2. 找到 &quot;通知&quot; 设置
              <br />
              3. 选择 &quot;允许&quot;
              <br />
              4. 刷新页面
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-ink-surface rounded-lg border border-border-subtle">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">浏览器推送通知</h3>
            <p className="text-sm text-text-secondary">
              {subscribed
                ? '已启用 - 即使关闭页面也能收到通知'
                : '启用后可在订单状态更新时收到实时通知'}
            </p>
          </div>
        </div>

        {subscribed ? (
          <span className="px-3 py-1 bg-success/15 text-success text-sm font-medium rounded-full">
            已启用
          </span>
        ) : (
          <span className="px-3 py-1 bg-ink-elevated text-text-secondary text-sm font-medium rounded-full">
            未启用
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/15 border border-danger/40 rounded-lg">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!subscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-accent text-text-onAccent font-medium rounded-lg hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner size="sm" tone="inverse" className="w-4 h-4 text-current" />
                处理中...
              </span>
            ) : (
              '启用推送通知'
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-success text-text-primary font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" tone="inverse" className="w-4 h-4 text-current" />
                  发送中...
                </span>
              ) : (
                '发送测试通知'
              )}
            </button>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="px-4 py-2 bg-ink-elevated text-text-secondary font-medium rounded-lg hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" tone="inverse" className="w-4 h-4 text-current" />
                  处理中...
                </span>
              ) : (
                '禁用'
              )}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle">
        <h4 className="text-sm font-medium text-text-primary mb-2">通知类型：</h4>
        <ul className="text-sm text-text-secondary space-y-2">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> 订单状态更新（创建、确认、完成、取消）</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> 支付确认（成功、失败、退款）</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> 积分获得提醒</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> 优惠券到账通知</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> 系统公告</li>
        </ul>
      </div>

      {subscribed && (
        <div className="mt-4 p-3 bg-info-soft border border-border-subtle rounded-lg">
          <p className="text-sm text-info">
            💡 即使关闭网页，您也能在浏览器或系统通知中心收到重要更新！
          </p>
        </div>
      )}
    </div>
  );
}
