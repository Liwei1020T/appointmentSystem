/**
 * Web Push Service Worker
 * 
 * 处理 Web Push 通知的接收和显示
 * - 监听推送消息
 * - 显示通知
 * - 处理通知点击事件
 * - 处理通知关闭事件
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// ============================
// Push Event Listener
// ============================

self.addEventListener('push', (event: PushEvent) => {
  console.log('[Service Worker] Push received:', event);

  if (!event.data) {
    console.warn('[Service Worker] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'String Service Platform';
    const options: NotificationOptions = {
      body: data.message || data.body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      image: data.image,
      tag: data.tag || `notification-${Date.now()}`,
      requireInteraction: data.priority === 'urgent',
      data: {
        url: data.url || data.action_url || '/',
        notificationId: data.notificationId,
        referenceType: data.reference_type,
        referenceId: data.reference_id,
        ...data
      },
      actions: data.actions || [
        { action: 'view', title: '查看详情', icon: '/icons/view.png' },
        { action: 'dismiss', title: '忽略', icon: '/icons/dismiss.png' }
      ],
      vibrate: data.priority === 'urgent' ? [200, 100, 200] : [100],
      timestamp: Date.now(),
      silent: false,
      renotify: true
    };

    // 根据通知类型设置不同的图标和行为
    switch (data.type) {
      case 'order_completed':
        options.icon = '/icons/order-complete.png';
        options.badge = '/icons/badge-order.png';
        options.requireInteraction = true;
        break;
      case 'payment_verified':
        options.icon = '/icons/payment-success.png';
        options.badge = '/icons/badge-payment.png';
        break;
      case 'low_stock':
        options.icon = '/icons/warning.png';
        options.badge = '/icons/badge-warning.png';
        options.requireInteraction = true;
        break;
      case 'points_earned':
        options.icon = '/icons/points.png';
        options.badge = '/icons/badge-points.png';
        break;
      case 'voucher_received':
        options.icon = '/icons/voucher.png';
        options.badge = '/icons/badge-voucher.png';
        break;
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

// ============================
// Notification Click Event
// ============================

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  // 如果用户点击"忽略"，直接关闭
  if (action === 'dismiss') {
    return;
  }

  // 决定跳转的 URL
  let targetUrl = data.url || '/';

  // 根据通知类型跳转到不同页面
  if (data.referenceType && data.referenceId) {
    switch (data.referenceType) {
      case 'order':
        targetUrl = `/orders/${data.referenceId}`;
        break;
      case 'payment':
        targetUrl = `/payment/${data.referenceId}`;
        break;
      case 'package':
        targetUrl = `/profile/packages`;
        break;
      case 'points':
        targetUrl = `/points`;
        break;
      case 'voucher':
        targetUrl = `/vouchers`;
        break;
      default:
        targetUrl = '/';
    }
  }

  // 打开或聚焦到目标页面
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 查找已经打开的标签页
      for (const client of clientList) {
        if (client.url === new URL(targetUrl, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }

      // 如果没有已打开的标签页，打开新标签页
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ============================
// Notification Close Event
// ============================

self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
  
  // 可以在这里记录用户忽略了通知（用于分析）
  const data = event.notification.data;
  
  // 发送分析数据到服务器（可选）
  if (data.notificationId) {
    event.waitUntil(
      fetch('/api/analytics/notification-dismissed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId: data.notificationId,
          dismissedAt: new Date().toISOString()
        })
      }).catch(err => console.error('Failed to log notification dismissal:', err))
    );
  }
});

// ============================
// Service Worker Activation
// ============================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// ============================
// Service Worker Installation
// ============================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

export {};
