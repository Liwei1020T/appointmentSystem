/**
 * 通知铃铛图标组件 (Notification Bell Icon)
 * 
 * 功能：
 * - 显示通知铃铛
 * - 显示未读数量徽章
 * - 点击打开通知面板
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '@/services/notificationService';

interface NotificationBellProps {
  onClick: () => void;
  userId: string;
}

export default function NotificationBell({ onClick, userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 加载未读数量
  const loadUnreadCount = useCallback(async () => {
    const { count } = await getUnreadCount(userId);
    setUnreadCount(count);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadUnreadCount();

    // 轮询检查通知更新（替代 Supabase realtime）
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 每30秒检查一次

    return () => {
      clearInterval(interval);
    };
  }, [userId, loadUnreadCount]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="通知"
    >
      <Bell className="w-5 h-5 text-gray-700" />

      {/* 未读数量徽章 */}
      {!loading && unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
