/**
 * 退款状态徽章组件
 * 
 * 用途：
 * - 显示退款状态的可视化徽章
 * - 不同状态使用不同颜色
 * - 支持中英文显示
 * 
 * 状态颜色映射：
 * - pending（待处理）: 黄色
 * - approved（已批准）: 蓝色
 * - processing（处理中）: 紫色
 * - completed（已完成）: 绿色
 * - rejected（已拒绝）: 红色
 * - failed（失败）: 红色
 */

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { RefundStatus } from '@/services/refundService';

interface RefundStatusBadgeProps {
  status: RefundStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 退款状态配置
 */
const STATUS_CONFIG: Record<RefundStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  pending: {
    label: '待处理',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock,
  },
  approved: {
    label: '已批准',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: ThumbsUp,
  },
  processing: {
    label: '处理中',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Loader2,
  },
  completed: {
    label: '已完成',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  rejected: {
    label: '已拒绝',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  failed: {
    label: '失败',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
  },
};

export default function RefundStatusBadge({ 
  status, 
  showIcon = true,
  size = 'md' 
}: RefundStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // 根据尺寸设置样式
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${config.bgColor} ${config.color}
      ${sizeStyles[size]}
    `}>
      {showIcon && (
        <Icon className={`${iconSizes[size]} ${status === 'processing' ? 'animate-spin' : ''}`} />
      )}
      <span>{config.label}</span>
    </div>
  );
}
