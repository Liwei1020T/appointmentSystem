/**
 * 订单时间线组件 (Order Timeline)
 * 
 * 可视化显示订单状态变更历史和服务进度
 */

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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
}

// 状态配置
const statusConfig = {
  pending: {
    label: '订单已创建',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    iconBg: 'bg-yellow-100',
  },
  payment_pending: {
    label: '等待支付',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    iconBg: 'bg-orange-100',
  },
  payment_confirmed: {
    label: '支付已确认',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
  },
  in_progress: {
    label: '穿线处理中',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
  },
  completed: {
    label: '服务完成',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    iconBg: 'bg-green-100',
  },
  cancelled: {
    label: '订单已取消',
    icon: XCircle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    iconBg: 'bg-slate-100',
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
}: OrderTimelineProps) {
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
      // 如果订单已经进入处理阶段，支付应该视为已完成
      const isPaymentDone = paymentStatus === 'completed' || currentStatus === 'in_progress' || currentStatus === 'completed';
      
      events.push({
        status: isPaymentDone ? 'payment_confirmed' : 'payment_pending',
        timestamp:
          isPaymentDone
            ? (paymentConfirmedAt || updatedAt || createdAt)
            : (paymentPendingAt || updatedAt || createdAt),
        description: isPaymentDone ? '支付已确认' : '等待支付确认',
        completed: isPaymentDone,
        active: currentStatus === 'pending' && paymentStatus === 'pending',
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse mb-1">
                  进行中
                </span>
              )}

              {event.timestamp && (
                <div className={`text-xs ${event.completed || event.active ? 'text-slate-600' : 'text-slate-400'}`}>
                  {formatDate(event.timestamp, 'yyyy/MM/dd HH:mm:ss')}
                </div>
              )}

              {event.description && (
                <div className={`text-xs mt-1 ${event.completed || event.active ? 'text-slate-500' : 'text-slate-400'}`}>
                  {event.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图标行，保证在同一水平线 */}
      <div className="flex items-center justify-between gap-2 md:gap-4 mt-3">
        {events.map((event, index) => {
          const config = statusConfig[event.status];
          const isLast = index === events.length - 1;
          const IconComponent = config.icon;

          return (
            <div key={index} className="flex-1 flex items-center">
              <div className="flex-shrink-0 relative z-10 mx-auto">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${config.iconBg} ${config.borderColor} border-2
                    ${event.active ? 'ring-4 ring-blue-100' : ''}
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
                      <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* 横向连接线 */}
              {!isLast && (
                <div 
                  className={`
                    flex-1 h-0.5 
                    ${event.completed ? 'bg-green-300' : 'bg-slate-200'}
                    transition-colors duration-300
                  `} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
