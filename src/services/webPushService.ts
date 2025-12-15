/**
 * Web Push Service
 * 处理 Web Push 通知功能
 */

/**
 * 检查浏览器是否支持 Web Push
 */
export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * 获取通知权限状态
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'default';
  return Notification.permission;
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'default';
  return await Notification.requestPermission();
}

/**
 * 获取当前 Push 订阅
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * 订阅 Push 通知
 */
export async function subscribeToPush(): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (!isWebPushSupported()) {
    return { success: false, error: 'Web Push not supported' };
  }

  try {
    // 请求权限
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    // 注册 Service Worker
    const registration = await navigator.serviceWorker.ready;

    // 获取 VAPID 公钥
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) {
      return { success: false, error: 'Failed to get VAPID key' };
    }
    const { publicKey } = await response.json();

    // 订阅
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    // 保存订阅到服务器
    const saveResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    if (!saveResponse.ok) {
      return { success: false, error: 'Failed to save subscription' };
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: 'Failed to subscribe' };
  }
}

/**
 * 取消订阅 Push 通知
 */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      return { success: true };
    }

    // 取消订阅
    await subscription.unsubscribe();

    // 从服务器删除订阅
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return { success: false, error: 'Failed to unsubscribe' };
  }
}

/**
 * 发送测试通知
 */
export async function sendTestNotification(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to send test notification' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending test notification:', error);
    return { success: false, error: 'Failed to send test notification' };
  }
}

/**
 * 工具函数：将 Base64 URL 转换为 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
