/**
 * 实时订单 Provider 组件 (Realtime Order Provider)
 * 
 * 全局管理订单实时订阅，在应用层面提供统一的实时更新通知
 * 用于在 Layout 中包裹所有页面，确保用户在任何页面都能收到订单更新通知
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { subscribeToUserOrders, RealtimeSubscription } from '@/services/realtimeService';
import {
  getOrderStatusNotification,
  showBrowserNotification,
  playNotificationSound,
  requestNotificationPermission,
  OrderStatus,
  OrderNotificationMessage,
} from '@/lib/orderNotificationHelper';
import Toast from '@/components/Toast';

/**
 * Context 接口
 */
interface RealtimeOrderContextValue {
  isConnected: boolean;
  lastNotification: OrderNotificationMessage | null;
  requestPermission: () => Promise<NotificationPermission>;
}

const RealtimeOrderContext = createContext<RealtimeOrderContextValue>({
  isConnected: false,
  lastNotification: null,
  requestPermission: async () => 'default',
});

/**
 * Hook：使用实时订单上下文
 */
export function useRealtimeOrder() {
  return useContext(RealtimeOrderContext);
}

interface RealtimeOrderProviderProps {
  children: React.ReactNode;
}

/**
 * 实时订单 Provider 组件
 */
export default function RealtimeOrderProvider({ children }: RealtimeOrderProviderProps) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [channel, setChannel] = useState<RealtimeSubscription | null>(null);
  const [lastNotification, setLastNotification] = useState<OrderNotificationMessage | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  // 处理订单状态更新
  const handleOrderUpdate = useCallback((payload: any) => {
    const { eventType, old, new: newData } = payload;

    // 仅处理状态变化
    if (eventType === 'UPDATE' && old.status !== newData.status) {
      const notification = getOrderStatusNotification(
        old.status as OrderStatus,
        newData.status as OrderStatus,
        newData.id,
        '订单' // 全局通知使用简单描述
      );

      // 保存最新通知
      setLastNotification(notification);

      // 显示 Toast
      const toastType = notification.type === 'error'
        ? 'error'
        : notification.type === 'success'
        ? 'success'
        : 'info';
      setToast({
        show: true,
        message: notification.message,
        type: toastType,
      });

      // 播放音效
      playNotificationSound(toastType);

      // 浏览器通知
      showBrowserNotification(notification);
    }
  }, []);

  // 订阅订单更新
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const subscription = subscribeToUserOrders(userId, handleOrderUpdate);
      setChannel(subscription);
      setIsConnected(true);

      return () => {
        subscription.unsubscribe();
        setIsConnected(false);
      };
    } else {
      setIsConnected(false);
    }
  }, [session?.user?.id, handleOrderUpdate]);

  // 请求浏览器通知权限
  const requestPermission = useCallback(async () => {
    return await requestNotificationPermission();
  }, []);

  const contextValue: RealtimeOrderContextValue = {
    isConnected,
    lastNotification,
    requestPermission,
  };

  return (
    <RealtimeOrderContext.Provider value={contextValue}>
      {children}

      {/* 全局 Toast 通知 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </RealtimeOrderContext.Provider>
  );
}
