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
import {
  isWebPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  sendTestNotification
} from '@/services/webPushService';

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
        alert('✅ Web Push 通知已启用！');
      } else {
        throw new Error('订阅失败');
      }
    } catch (err: any) {
      setError(err.message || '订阅失败');
      console.error('Subscribe error:', err);
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
        alert('✅ 已取消 Web Push 通知');
      } else {
        throw new Error('取消订阅失败');
      }
    } catch (err: any) {
      setError(err.message || '取消订阅失败');
      console.error('Unsubscribe error:', err);
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
        alert('✅ 测试通知已发送！请查看系统通知。');
      } else {
        throw new Error('发送测试通知失败');
      }
    } catch (err: any) {
      setError(err.message || '发送失败');
      console.error('Test notification error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">不支持 Web Push</h3>
            <p className="text-sm text-gray-600">
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
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔕</span>
          <div>
            <h3 className="font-semibold text-red-900 mb-1">通知权限被拒绝</h3>
            <p className="text-sm text-red-700">
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
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-semibold text-gray-900">浏览器推送通知</h3>
            <p className="text-sm text-gray-600">
              {subscribed 
                ? '已启用 - 即使关闭页面也能收到通知' 
                : '启用后可在订单状态更新时收到实时通知'}
            </p>
          </div>
        </div>

        {subscribed ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            已启用
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            未启用
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!subscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '启用推送通知'}
          </button>
        ) : (
          <>
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '发送中...' : '发送测试通知'}
            </button>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : '禁用'}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">通知类型：</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ 订单状态更新（创建、确认、完成、取消）</li>
          <li>✅ 支付确认（成功、失败、退款）</li>
          <li>✅ 积分获得提醒</li>
          <li>✅ 优惠券到账通知</li>
          <li>✅ 系统公告</li>
        </ul>
      </div>

      {subscribed && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 即使关闭网页，您也能在浏览器或系统通知中心收到重要更新！
          </p>
        </div>
      )}
    </div>
  );
}
