/**
 * 订单时间线组件 (Order Timeline)
 *
 * 可视化显示订单状态变更历史和服务进度
 * 支持 ETA 预计完成时间显示
 */

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, XCircle, Timer } from 'lucide-react';

export type TimelineEvent = {
  status: 'pending' | 'payment_pending' | 'payment_confirmed' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: string;
  description?: string;
  active?: boolean;
  completed?: boolean;
};

interface OrderTimelineProps {
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  hasPayment?: boolean;
  paymentStatus?: string;
  usePackage?: boolean;
  // 可选的额外时间节点
  paymentConfirmedAt?: string;
  inProgressAt?: string;
  paymentPendingAt?: string;
  // ETA 相关字段
  estimatedCompletionAt?: string | null;
  queuePosition?: number | null;
}

// 状态配置
const statusConfig = {
  pending: {
    label: '订单已创建',
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconBg: 'bg-warning/15',
  },
  payment_pending: {
    label: '等待支付',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconBg: 'bg-warning/15',
  },
  payment_confirmed: {
    label: '支付已确认',
    icon: CheckCircle,
    color: 'text-info',
    bgColor: 'bg-info-soft',
    borderColor: 'border-info/30',
    iconBg: 'bg-info-soft',
  },
  in_progress: {
    label: '穿线处理中',
    icon: Clock,
    color: 'text-info',
    bgColor: 'bg-info-soft',
    borderColor: 'border-info/30',
    iconBg: 'bg-info-soft',
  },
  completed: {
    label: '服务完成',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    iconBg: 'bg-success/15',
  },
  cancelled: {
    label: '订单已取消',
    icon: XCircle,
    color: 'text-text-secondary',
    bgColor: 'bg-ink-elevated',
    borderColor: 'border-border-subtle',
    iconBg: 'bg-ink-elevated',
  },
};

export default function OrderTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  completedAt,
  cancelledAt,
  hasPayment = false,
  paymentStatus = 'pending',
  usePackage = false,
  paymentConfirmedAt,
  inProgressAt,
  paymentPendingAt,
  estimatedCompletionAt,
  queuePosition,
}: OrderTimelineProps) {
  // 格式化 ETA 显示
  const formatEta = (etaDate: string | null | undefined): string => {
    if (!etaDate) return '';
    const eta = new Date(etaDate);
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return '今日完成';
    if (diffDays === 1) return '明天完成';
    if (diffDays <= 7) return `${diffDays} 天后完成`;

    const month = eta.getMonth() + 1;
    const day = eta.getDate();
    return `${month}月${day}日完成`;
  };
  // 生成时间线事件
  const generateEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // 1. 订单创建
    events.push({
      status: 'pending',
      timestamp: createdAt,
      description: '订单已提交',
      completed: true,
      active: currentStatus === 'pending' && !hasPayment,
    });

    if (currentStatus === 'cancelled') {
      // 取消流程
      events.push({
        status: 'cancelled',
        timestamp: cancelledAt || updatedAt || createdAt,
        description: '订单已被取消',
        completed: true,
        active: true,
      });
      return events;
    }

    // 2. 支付流程（如果不使用套餐）
    if (!usePackage && hasPayment) {
      // 如果订单已经进入处理阶段，或者支付状态为 success/completed，支付应该视为已完成
      const isPaymentDone =
        paymentStatus === 'success' ||
        paymentStatus === 'completed' ||
        currentStatus === 'in_progress' ||
        currentStatus === 'completed';

      events.push({
        status: isPaymentDone ? 'payment_confirmed' : 'payment_pending',
        timestamp:
          isPaymentDone
            ? (paymentConfirmedAt || updatedAt || createdAt)
            : (paymentPendingAt || updatedAt || createdAt),
        description: isPaymentDone ? '支付已确认' : '等待支付确认',
        completed: isPaymentDone,
        active: !isPaymentDone && currentStatus === 'pending',
      });
    }

    // 3. 处理中
    events.push({
      status: 'in_progress',
      timestamp:
        currentStatus === 'in_progress' || currentStatus === 'completed'
          ? (inProgressAt || updatedAt || createdAt)
          : '',
      description: currentStatus === 'in_progress' ? '正在进行穿线服务' : currentStatus === 'completed' ? '穿线服务已完成' : '待开始处理',
      completed: currentStatus === 'completed',
      active: currentStatus === 'in_progress',
    });

    // 4. 完成
    events.push({
      status: 'completed',
      timestamp: currentStatus === 'completed' ? (completedAt || updatedAt || createdAt) : '',
      description: currentStatus === 'completed' ? '穿线完成，可取拍' : '等待完成',
      completed: currentStatus === 'completed',
      active: false,
    });

    return events;
  };

  const events = generateEvents();

  return (
    <div className="relative">
      {/* 文案行 */}
      <div className="flex items-start justify-between gap-2 md:gap-4">
        {events.map((event, index) => {
          const config = statusConfig[event.status];
          return (
            <div key={index} className="flex-1 text-center px-2">
              <div
                className={`
                  font-medium ${config.color}
                  ${event.active ? 'text-sm md:text-base' : 'text-xs md:text-sm'}
                  ${!event.completed && !event.active ? 'opacity-50' : ''}
                  transition-all duration-300
                  mb-1
                `}
              >
                {config.label}
              </div>

              {event.active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent animate-pulse mb-1">
                  进行中
                </span>
              )}

              {event.timestamp && (
                <div className={`text-xs ${event.completed || event.active ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {formatDate(event.timestamp, 'yyyy/MM/dd HH:mm:ss')}
                </div>
              )}

              {event.description && (
                <div className={`text-xs mt-1 ${event.completed || event.active ? 'text-text-tertiary' : 'text-text-tertiary'}`}>
                  {event.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图标行，保证在同一水平线 */}
      <div className="flex items-center mt-3">
        {events.map((event, index) => {
          const config = statusConfig[event.status];
          const isLast = index === events.length - 1;
          const IconComponent = config.icon;

          return (
            <React.Fragment key={index}>
              {/* 图标 */}
              <div className="flex-shrink-0 relative z-10">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${config.iconBg} ${config.borderColor} border-2
                    ${event.active ? 'ring-4 ring-accent/20' : ''}
                    ${!event.completed && !event.active ? 'opacity-40' : ''}
                    transition-all duration-300
                  `}
                >
                  <IconComponent
                    className={`w-5 h-5 ${config.color}`}
                    strokeWidth={event.active ? 2.5 : 2}
                  />
                  {event.completed && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle className="w-4 h-4 text-success bg-ink-surface rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* 横向连接线 - 放在图标之间，使用 flex-1 自动填充 */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-1
                    ${event.completed ? 'bg-success/40' : 'bg-border-subtle'}
                    transition-colors duration-300
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ETA 预计完成时间显示 - 仅对进行中的订单显示 */}
      {estimatedCompletionAt && (currentStatus === 'pending' || currentStatus === 'in_progress') && (
        <div className="mt-4 bg-accent/5 border border-accent/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/15 rounded-full flex items-center justify-center">
                <Timer className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">预计完成时间</p>
                <p className="text-sm font-semibold text-accent">{formatEta(estimatedCompletionAt)}</p>
              </div>
            </div>
            {queuePosition && queuePosition > 0 && (
              <div className="text-right">
                <p className="text-xs text-text-tertiary">队列位置</p>
                <p className="text-sm font-semibold text-text-primary">第 {queuePosition} 位</p>
              </div>
            )}
          </div>
          {estimatedCompletionAt && (
            <p className="text-xs text-text-tertiary mt-2 text-center">
              预计 {formatDate(estimatedCompletionAt, 'MM月dd日 HH:mm')} 前完成
            </p>
          )}
        </div>
      )}
    </div>
  );
}
