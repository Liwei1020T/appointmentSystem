/**
 * 管理员订单进度管理组件 (Admin Order Progress Manager)
 * 
 * 功能：
 * - 显示订单详细进度
 * - 快速更新订单状态
 * - 添加进度备注
 * - 预计完成时间
 */

'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, PlayCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { updateOrderStatus } from '@/services/adminOrderService';
import { completeOrder } from '@/services/completeOrderService';
import { toast } from 'sonner';

interface AdminOrderProgressProps {
  orderId: string;
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  onStatusUpdate?: () => void;
}

type ProgressStep = {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  action?: {
    label: string;
    nextStatus: 'in_progress' | 'completed' | 'cancelled';
    confirmMessage?: string;
  };
};

export default function AdminOrderProgress({
  orderId,
  currentStatus,
  createdAt,
  updatedAt,
  completedAt,
  cancelledAt,
  onStatusUpdate,
}: AdminOrderProgressProps) {
  const [updating, setUpdating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // 生成进度步骤
  const generateSteps = (): ProgressStep[] => {
    const steps: ProgressStep[] = [
      {
        id: 'pending',
        label: '订单已创建',
        status: 'completed',
        description: formatDate(createdAt),
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/15',
      },
    ];

    if (currentStatus === 'cancelled') {
      steps.push({
        id: 'cancelled',
        label: '订单已取消',
        status: 'cancelled',
        description: formatDate(cancelledAt || updatedAt || createdAt),
        icon: XCircle,
        color: 'text-danger',
        bgColor: 'bg-danger/15',
      });
      return steps;
    }

    // 穿线中
    if (currentStatus === 'pending') {
      steps.push({
        id: 'in_progress',
        label: '穿线处理',
        status: 'pending',
        description: '待开始',
        icon: Clock,
        color: 'text-text-tertiary',
        bgColor: 'bg-ink-elevated',
        action: {
          label: '开始穿线',
          nextStatus: 'in_progress',
          confirmMessage: '确认开始穿线服务？',
        },
      });
    } else {
      steps.push({
        id: 'in_progress',
        label: '穿线处理',
        status: currentStatus === 'in_progress' ? 'in_progress' : 'completed',
        description: formatDate(updatedAt || createdAt),
        icon: currentStatus === 'in_progress' ? PlayCircle : CheckCircle,
        color: currentStatus === 'in_progress' ? 'text-info' : 'text-success',
        bgColor: currentStatus === 'in_progress' ? 'bg-info-soft' : 'bg-success/15',
      });
    }

    // 完成
    if (currentStatus === 'completed') {
      steps.push({
        id: 'completed',
        label: '服务完成',
        status: 'completed',
        description: formatDate(completedAt || updatedAt || createdAt),
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/15',
      });
    } else if (currentStatus === 'in_progress') {
      steps.push({
        id: 'completed',
        label: '服务完成',
        status: 'pending',
        description: '待完成',
        icon: Clock,
        color: 'text-text-tertiary',
        bgColor: 'bg-ink-elevated',
        action: {
          label: '完成订单',
          nextStatus: 'completed',
          confirmMessage: '确认完成订单？将扣减库存并奖励积分。',
        },
      });
    } else {
      steps.push({
        id: 'completed',
        label: '服务完成',
        status: 'pending',
        description: '等待处理',
        icon: Clock,
        color: 'text-text-tertiary',
        bgColor: 'bg-ink-elevated',
      });
    }

    return steps;
  };

  const handleUpdateStatus = async (nextStatus: 'in_progress' | 'completed' | 'cancelled', actionLabel: string) => {
    setUpdating(true);
    setActiveAction(nextStatus);

    try {
      if (nextStatus === 'completed') {
        // 使用完成订单服务
        const { data, error } = await completeOrder(orderId, `管理员操作：${actionLabel}`);
        if (error) {
          toast.error(error);
        } else if (data) {
          toast.success(`订单已完成！积分: ${data.points_granted}, 利润: RM${Number(data.profit).toFixed(2)}`);
          onStatusUpdate?.();
        }
      } else {
        // 普通状态更新
        const { order, error } = await updateOrderStatus(orderId, nextStatus, `管理员操作：${actionLabel}`);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(`已更新为：${actionLabel}`);
          onStatusUpdate?.();
        }
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setUpdating(false);
      setActiveAction(null);
    }
  };

  const steps = generateSteps();

  return (
    <div className="bg-ink-surface rounded-xl p-6 shadow-sm border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">服务进度</h2>
        {currentStatus === 'in_progress' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-info-soft text-info animate-pulse">
            <PlayCircle className="w-4 h-4 mr-1" />
            处理中
          </span>
        )}
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isLast = index === steps.length - 1;
          const isActive = step.status === 'in_progress';
          const isCompleted = step.status === 'completed';
          const isPending = step.status === 'pending';
          const isActionActive = activeAction === step.action?.nextStatus;

          return (
            <div key={step.id} className="relative">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${step.bgColor} border-2
                      ${isActive ? 'border-info/60 ring-4 ring-info/20' : 'border-transparent'}
                      ${isCompleted ? 'border-success/50' : ''}
                      ${isPending ? 'opacity-50' : ''}
                      transition-all duration-300
                    `}
                  >
                    <IconComponent 
                      className={`w-6 h-6 ${step.color}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  {!isLast && (
                    <div 
                      className={`
                        w-0.5 h-12 my-1
                        ${isCompleted ? 'bg-success/40' : 'bg-border-subtle'}
                        transition-colors duration-300
                      `}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${step.color} ${isActive ? 'text-lg' : 'text-base'}`}>
                        {step.label}
                      </div>
                      <div className={`text-sm mt-1 ${isPending ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                        {step.description}
                      </div>
                    </div>

                    {/* Action Button */}
                    {step.action && !updating && (
                      <button
                        onClick={() => {
                          if (step.action!.confirmMessage) {
                            if (confirm(step.action!.confirmMessage)) {
                              handleUpdateStatus(step.action!.nextStatus, step.action!.label);
                            }
                          } else {
                            handleUpdateStatus(step.action!.nextStatus, step.action!.label);
                          }
                        }}
                        disabled={updating}
                        className={`
                          px-4 py-2 rounded-lg font-medium text-sm
                          ${step.action.nextStatus === 'completed' 
                            ? 'bg-success hover:bg-success/90 text-text-primary' 
                            : 'bg-accent hover:shadow-glow text-text-onAccent'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors
                          flex items-center gap-2
                        `}
                      >
                        {step.action.nextStatus === 'completed' ? '✓' : '▶'}
                        {step.action.label}
                      </button>
                    )}

                    {isActionActive && updating && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        更新中...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 取消按钮 (仅当订单未完成或取消时显示) */}
      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <button
            onClick={() => {
              if (confirm('确认取消订单？此操作不可恢复。')) {
                handleUpdateStatus('cancelled', '取消订单');
              }
            }}
            disabled={updating}
            className="w-full px-4 py-2 text-sm text-danger border border-danger/40 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消订单
          </button>
        </div>
      )}
    </div>
  );
}
