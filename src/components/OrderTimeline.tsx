/**
 * 订单时间线组件 (Order Timeline)
 * 
 * 可视化显示订单状态变更历史
 */

import React from 'react';
import { formatDate } from '@/lib/utils';

export type TimelineEvent = {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: string;
  description?: string;
};

interface OrderTimelineProps {
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// 状态配置
const statusConfig = {
  pending: {
    label: '订单已创建',
    icon: '📝',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  in_progress: {
    label: '穿线处理中',
    icon: '⚙️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  completed: {
    label: '穿线完成',
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  cancelled: {
    label: '订单已取消',
    icon: '❌',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
  },
};

export default function OrderTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  completedAt,
  cancelledAt,
}: OrderTimelineProps) {
  // 生成时间线事件
  const generateEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [
      {
        status: 'pending',
        timestamp: createdAt,
        description: '订单已提交，等待处理',
      },
    ];

    if (currentStatus === 'cancelled') {
      // 取消状态
      events.push({
        status: 'cancelled',
        timestamp: cancelledAt || updatedAt || createdAt,
        description: '订单已被取消',
      });
    } else {
      // 正常流程
      if (currentStatus === 'in_progress' || currentStatus === 'completed') {
        events.push({
          status: 'in_progress',
          timestamp: updatedAt || createdAt,
          description: '正在进行穿线服务',
        });
      }

      if (currentStatus === 'completed') {
        events.push({
          status: 'completed',
          timestamp: completedAt || updatedAt || createdAt,
          description: '穿线完成，可取拍',
        });
      }
    }

    return events;
  };

  const events = generateEvents();

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const config = statusConfig[event.status];
        const isLast = index === events.length - 1;
        const isActive = event.status === currentStatus;

        return (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {/* 垂直线 */}
            {!isLast && (
              <div className="absolute left-[15px] top-[32px] bottom-0 w-0.5 bg-slate-200" />
            )}

            {/* 图标节点 */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-lg ${
                isActive ? config.bgColor : 'bg-slate-100'
              } ${isActive ? `border-2 ${config.borderColor}` : 'border-2 border-slate-200'}`}
            >
              <span>{config.icon}</span>
            </div>

            {/* 内容 */}
            <div className="flex-1 pt-0.5">
              <h4
                className={`font-semibold ${
                  isActive ? config.color : 'text-slate-600'
                }`}
              >
                {config.label}
              </h4>
              {event.description && (
                <p className="text-sm text-slate-600 mt-1">{event.description}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {formatDate(event.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
