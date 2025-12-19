/**
 * 订单通知辅助函数 (Order Notification Helpers)
 * 
 * 处理订单状态变化的通知逻辑
 * 包括：Toast 通知、浏览器推送、状态文案生成等
 */

/**
 * 订单状态枚举
 */
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知消息接口
 */
export interface OrderNotificationMessage {
  title: string;
  message: string;
  type: NotificationType;
  orderId: string;
  timestamp: Date;
}

/**
 * 订单状态变化通知配置
 */
const ORDER_STATUS_NOTIFICATIONS: Record<
  OrderStatus,
  {
    title: string;
    messageTemplate: (orderInfo: string) => string;
    type: NotificationType;
    icon: string;
  }
> = {
  pending: {
    title: '订单待处理',
    messageTemplate: (orderInfo) => `您的订单 ${orderInfo} 已提交，等待处理中`,
    type: 'info',
    icon: '⏳',
  },
  in_progress: {
    title: '订单处理中',
    messageTemplate: (orderInfo) => `您的订单 ${orderInfo} 正在穿线中，请耐心等待`,
    type: 'info',
    icon: '🎾',
  },
  completed: {
    title: '订单已完成',
    messageTemplate: (orderInfo) => `您的订单 ${orderInfo} 已完成，请前来取货！`,
    type: 'success',
    icon: '✅',
  },
  cancelled: {
    title: '订单已取消',
    messageTemplate: (orderInfo) => `您的订单 ${orderInfo} 已取消`,
    type: 'warning',
    icon: '❌',
  },
};

/**
 * 获取订单状态变化通知
 * @param oldStatus - 旧状态
 * @param newStatus - 新状态
 * @param orderId - 订单 ID
 * @param orderInfo - 订单简要信息（如球线型号）
 * @returns 通知消息对象
 */
export function getOrderStatusNotification(
  oldStatus: OrderStatus,
  newStatus: OrderStatus,
  orderId: string,
  orderInfo: string = '订单'
): OrderNotificationMessage {
  const config = ORDER_STATUS_NOTIFICATIONS[newStatus];

  return {
    title: config.title,
    message: config.messageTemplate(orderInfo),
    type: config.type,
    orderId,
    timestamp: new Date(),
  };
}

/**
 * 获取订单状态文案
 * @param status - 订单状态
 * @returns 状态文案
 */
export function getOrderStatusText(status: OrderStatus): string {
  const statusTexts: Record<OrderStatus, string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  };

  return statusTexts[status] || status;
}

/**
 * 获取订单状态图标
 * @param status - 订单状态
 * @returns Emoji 图标
 */
export function getOrderStatusIcon(status: OrderStatus): string {
  return ORDER_STATUS_NOTIFICATIONS[status]?.icon || '📋';
}

/**
 * 获取订单状态颜色
 * @param status - 订单状态
 * @returns Tailwind CSS 颜色类名
 */
export function getOrderStatusColor(status: OrderStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    OrderStatus,
    { bg: string; text: string; border: string }
  > = {
    pending: {
      bg: 'bg-warning/15',
      text: 'text-warning',
      border: 'border-warning/40',
    },
    in_progress: {
      bg: 'bg-info-soft',
      text: 'text-info',
      border: 'border-info/40',
    },
    completed: {
      bg: 'bg-success/15',
      text: 'text-success',
      border: 'border-success/40',
    },
    cancelled: {
      bg: 'bg-danger/15',
      text: 'text-danger',
      border: 'border-danger/40',
    },
  };

  return colors[status] || colors.pending;
}

/**
 * 判断状态变化是否需要通知
 * @param oldStatus - 旧状态
 * @param newStatus - 新状态
 * @returns 是否需要通知
 */
export function shouldNotify(oldStatus: OrderStatus, newStatus: OrderStatus): boolean {
  // 所有状态变化都需要通知
  return oldStatus !== newStatus;
}

/**
 * 浏览器通知 API（需要用户授权）
 * @param notification - 通知消息
 */
export async function showBrowserNotification(
  notification: OrderNotificationMessage
): Promise<void> {
  // 检查浏览器是否支持通知
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  // 请求通知权限
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  // 如果权限被授予，显示通知
  if (Notification.permission === 'granted') {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png', // 需要在 public 文件夹添加图标
      badge: '/badge-72x72.png',
      tag: notification.orderId, // 防止重复通知
      requireInteraction: notification.type === 'success', // 完成状态需要用户交互才关闭
    });

    // 点击通知时跳转到订单详情
    browserNotification.onclick = () => {
      window.focus();
      window.location.href = `/orders/${notification.orderId}`;
      browserNotification.close();
    };

    // 5秒后自动关闭（除非是完成状态）
    if (notification.type !== 'success') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }
}

/**
 * 请求浏览器通知权限
 * @returns 权限状态
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * 检查是否已授权通知
 * @returns 是否已授权
 */
export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * 播放通知音效
 * @param type - 通知类型
 */
export function playNotificationSound(type: NotificationType): void {
  try {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 根据类型设置音频频率
    const frequencies: Record<NotificationType, number> = {
      success: 800, // 高音
      info: 600, // 中音
      warning: 400, // 低音
      error: 300, // 更低音
    };

    oscillator.frequency.value = frequencies[type] || 600;
    oscillator.type = 'sine';

    // 设置音量渐变
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    // 播放
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * 订单状态变化描述
 * @param oldStatus - 旧状态
 * @param newStatus - 新状态
 * @returns 变化描述
 */
export function getStatusChangeDescription(
  oldStatus: OrderStatus,
  newStatus: OrderStatus
): string {
  const transitions: Record<string, string> = {
    'pending-in_progress': '订单开始处理',
    'pending-cancelled': '订单被取消',
    'in_progress-completed': '订单已完成',
    'in_progress-cancelled': '订单处理中被取消',
  };

  const key = `${oldStatus}-${newStatus}`;
  return transitions[key] || `状态从 ${getOrderStatusText(oldStatus)} 变为 ${getOrderStatusText(newStatus)}`;
}

/**
 * 格式化通知时间
 * @param timestamp - 时间戳
 * @returns 格式化后的时间字符串
 */
export function formatNotificationTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  // 1分钟内
  if (diff < 60000) {
    return '刚刚';
  }

  // 1小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // 24小时内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 超过24小时，显示具体时间
  return timestamp.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
