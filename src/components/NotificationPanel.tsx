/**
 * 通知面板组件 (Notification Panel)
 * 
 * 功能：
 * - 显示通知列表
 * - 标记已读/未读
 * - 删除通知
 * - 实时更新
 * - 分页加载
 */

'use client';

import { useState, useEffect } from 'react';
import { X, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from '@/services/notificationService';
import NotificationItem from './NotificationItem';

interface NotificationPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ userId, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 加载通知列表
  const loadNotifications = async () => {
    setLoading(true);

    try {
      const unreadOnly = filter === 'unread';
      const data = await getNotifications(unreadOnly, 50);
      setNotifications((data?.notifications || []) as unknown as Notification[]);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId, filter]);

  // 标记单个通知为已读
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    loadNotifications();
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  // 删除通知
  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    loadNotifications();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* 侧边面板 */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-ink-surface shadow-2xl z-50 flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-ink-elevated">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text-primary">通知</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-accent bg-ink-surface rounded-full">
                {unreadCount} 条未读
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-ink-surface/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-ink-elevated">
          {/* 筛选器 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${filter === 'all'
                  ? 'bg-accent text-text-onAccent'
                  : 'bg-ink-surface text-text-secondary hover:bg-ink-elevated'
                }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${filter === 'unread'
                  ? 'bg-accent text-text-onAccent'
                  : 'bg-ink-surface text-text-secondary hover:bg-ink-elevated'
                }`}
            >
              未读
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="p-1.5 hover:bg-ink-elevated rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 hover:bg-ink-elevated rounded-lg transition-colors"
                title="全部标记为已读"
              >
                <CheckCheck className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* 通知列表 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-tertiary">
              <div className="text-5xl mb-3">🔔</div>
              <p className="text-sm">
                {filter === 'unread' ? '没有未读通知' : '暂无通知'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border-subtle bg-ink-elevated text-center">
            <p className="text-xs text-text-tertiary">
              共 {notifications.length} 条通知
              {filter === 'unread' && unreadCount === 0 && ' · 已全部已读'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
