/**
 * 实时订单 Provider 组件 (Realtime Order Provider)
 * 
 * 全局管理订单实时订阅，在应用层面提供统一的实时更新通知
 * 用于在 Layout 中包裹所有页面，确保用户在任何页面都能收到订单更新通知
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { subscribeToUserOrders, type OrderUpdateData } from '@/services/realtimeService';
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

interface SupabaseOrderUpdatePayload {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  old?: { id?: string; status?: string };
  new?: { id?: string; status?: string };
}

interface UserOrdersUpdatePayload {
  orders: OrderUpdateData[];
}

function isSupabaseOrderUpdatePayload(payload: unknown): payload is SupabaseOrderUpdatePayload {
  return typeof payload === 'object' && payload !== null && 'eventType' in payload;
}

function isUserOrdersUpdatePayload(payload: unknown): payload is UserOrdersUpdatePayload {
  if (!payload || typeof payload !== 'object') return false;
  return Array.isArray((payload as { orders?: unknown }).orders);
}

function toNotificationStatus(status: string | null | undefined): OrderStatus {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed' || status === 'picked_up') return 'completed';
  if (status === 'in_progress' || status === 'received') return 'in_progress';
  return 'pending';
}

/**
 * 实时订单 Provider 组件
 */
export default function RealtimeOrderProvider({ children }: RealtimeOrderProviderProps) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState<boolean>(false);
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
  const lastKnownStatusRef = useRef<Record<string, string>>({});

  // 处理订单状态更新
  const handleOrderUpdate = useCallback((payload: UserOrdersUpdatePayload | SupabaseOrderUpdatePayload) => {
    if (isSupabaseOrderUpdatePayload(payload)) {
      const { eventType, old, new: newData } = payload;
      if (eventType !== 'UPDATE' || !newData?.id || !newData.status || old?.status === newData.status) {
        return;
      }

      const notification = getOrderStatusNotification(
        toNotificationStatus(old?.status),
        toNotificationStatus(newData.status),
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
      lastKnownStatusRef.current[newData.id] = newData.status;
      return;
    }

    if (!isUserOrdersUpdatePayload(payload)) {
      return;
    }

    for (const update of payload.orders) {
      const previousStatus = lastKnownStatusRef.current[update.orderId];
      lastKnownStatusRef.current[update.orderId] = update.status;

      if (!previousStatus || previousStatus === update.status) {
        continue;
      }

      const notification = getOrderStatusNotification(
        toNotificationStatus(previousStatus),
        toNotificationStatus(update.status),
        update.orderId,
        '订单'
      );

      setLastNotification(notification);

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

      playNotificationSound(toastType);
      showBrowserNotification(notification);
    }
  }, []);

  // 订阅订单更新
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const subscription = subscribeToUserOrders(userId, handleOrderUpdate);
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
