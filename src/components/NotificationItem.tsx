/**
 * 通知项组件 (Notification Item)
 * 
 * 功能：
 * - 显示单条通知内容
 * - 标记已读/未读
 * - 删除操作
 * - 根据类型显示图标和颜色
 */

'use client';

import { useState } from 'react';
import { Trash2, Circle, CheckCircle2 } from 'lucide-react';
import {
  type Notification,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '@/services/notificationService';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);

  const icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.priority || notification.type);
  const timeText = formatNotificationTime(notification.created_at);

  return (
    <div
      className={`relative p-4 hover:bg-ink-elevated transition-colors ${
        !notification.is_read ? 'bg-accent/10' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
          <span className="text-xl">{icon}</span>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
              {notification.title}
            </h4>

            {/* 未读标记 */}
            {!notification.is_read && (
              <Circle className="flex-shrink-0 w-2 h-2 fill-accent text-accent mt-1" />
            )}
          </div>

          <p className="text-sm text-text-secondary mb-2 line-clamp-2">
            {notification.message}
          </p>

          <p className="text-xs text-text-tertiary">{timeText}</p>
        </div>
      </div>

      {/* 操作按钮（鼠标悬停显示） */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 bg-ink-surface shadow-md rounded-lg p-1 border border-border-subtle">
          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-1.5 hover:bg-ink-elevated rounded transition-colors"
              title="标记为已读"
            >
              <CheckCircle2 className="w-4 h-4 text-success" />
            </button>
          )}

          <button
            onClick={() => onDelete(notification.id)}
            className="p-1.5 hover:bg-ink-elevated rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      )}
    </div>
  );
}
