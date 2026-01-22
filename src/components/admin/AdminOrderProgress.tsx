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
import { Clock, CheckCircle, AlertCircle, PlayCircle, XCircle, Timer, Edit3, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { updateOrderStatus, updateOrderEta } from '@/services/adminOrderService';
import { completeOrder } from '@/services/completeOrderService';
import { toast } from 'sonner';
import InlineLoading from '@/components/loading/InlineLoading';

interface AdminOrderProgressProps {
  orderId: string;
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedCompletionAt?: string | null;
  queuePosition?: number | null;
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
  estimatedCompletionAt,
  queuePosition,
  onStatusUpdate,
}: AdminOrderProgressProps) {
  const [updating, setUpdating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showEtaModal, setShowEtaModal] = useState(false);
  const [etaDate, setEtaDate] = useState('');
  const [etaTime, setEtaTime] = useState('');
  const [savingEta, setSavingEta] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle: 'success' | 'danger' | 'accent';
    onConfirm: () => void;
  } | null>(null);

  const showConfirmModal = (
    title: string,
    message: string,
    confirmLabel: string,
    confirmStyle: 'success' | 'danger' | 'accent',
    onConfirm: () => void
  ) => {
    setConfirmModal({ show: true, title, message, confirmLabel, confirmStyle, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  // 生成进度步骤
  const generateSteps = (): ProgressStep[] => {
    const dateTimeFormat = 'yyyy/MM/dd HH:mm';
    const steps: ProgressStep[] = [
      {
        id: 'pending',
        label: '订单已创建',
        status: 'completed',
        description: formatDate(createdAt, dateTimeFormat),
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
        description: formatDate(cancelledAt || updatedAt || createdAt, dateTimeFormat),
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
        description: formatDate(updatedAt || createdAt, dateTimeFormat),
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
        description: formatDate(completedAt || updatedAt || createdAt, dateTimeFormat),
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

  // 格式化 ETA 显示
  const formatEtaLabel = (etaDate: string | null | undefined): string => {
    if (!etaDate) return '未设置';
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

  // 打开 ETA 编辑模态框
  const openEtaModal = () => {
    if (estimatedCompletionAt) {
      const eta = new Date(estimatedCompletionAt);
      setEtaDate(eta.toISOString().split('T')[0]);
      setEtaTime(eta.toTimeString().slice(0, 5));
    } else {
      // 默认 3 天后
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setEtaDate(defaultDate.toISOString().split('T')[0]);
      setEtaTime('18:00');
    }
    setShowEtaModal(true);
  };

  // 保存 ETA
  const handleSaveEta = async () => {
    if (!etaDate || !etaTime) {
      toast.error('请选择日期和时间');
      return;
    }

    setSavingEta(true);
    try {
      const newEta = new Date(`${etaDate}T${etaTime}:00`);
      const { order, error } = await updateOrderEta(orderId, newEta.toISOString());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('预计完成时间已更新');
        setShowEtaModal(false);
        onStatusUpdate?.();
      }
    } catch (err: any) {
      toast.error(err.message || '更新失败');
    } finally {
      setSavingEta(false);
    }
  };

  // 恢复系统计算
  const handleResetEta = async () => {
    setSavingEta(true);
    try {
      const { order, error } = await updateOrderEta(orderId, null);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('已恢复系统计算');
        setShowEtaModal(false);
        onStatusUpdate?.();
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setSavingEta(false);
    }
  };

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
                            showConfirmModal(
                              step.action!.label,
                              step.action!.confirmMessage,
                              '确认',
                              step.action!.nextStatus === 'completed' ? 'success' : 'accent',
                              () => handleUpdateStatus(step.action!.nextStatus, step.action!.label)
                            );
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
                        {step.action.nextStatus === 'completed' ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        {step.action.label}
                      </button>
                    )}

                    {isActionActive && updating && (
                      <InlineLoading label="更新中..." />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ETA 预计完成时间编辑区域 - 仅对未完成/未取消订单显示 */}
      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center">
                  <Timer className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">预计完成时间</p>
                  <p className="text-sm font-semibold text-accent">
                    {formatEtaLabel(estimatedCompletionAt)}
                  </p>
                  {estimatedCompletionAt && (
                    <p className="text-xs text-text-tertiary">
                      {formatDate(estimatedCompletionAt, 'MM月dd日 HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {queuePosition && queuePosition > 0 && (
                  <div className="text-right mr-3">
                    <p className="text-xs text-text-tertiary">队列位置</p>
                    <p className="text-sm font-semibold text-text-primary">第 {queuePosition} 位</p>
                  </div>
                )}
                <button
                  onClick={openEtaModal}
                  className="px-3 py-1.5 text-sm font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取消按钮 (仅当订单未完成或取消时显示) */}
      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <button
            onClick={() => {
              showConfirmModal(
                '取消订单',
                '确认取消订单？此操作不可恢复。',
                '确认取消',
                'danger',
                () => handleUpdateStatus('cancelled', '取消订单')
              );
            }}
            disabled={updating}
            className="w-full px-4 py-2 text-sm text-danger border border-danger/40 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消订单
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeConfirmModal}
          />

          {/* Modal */}
          <div className="relative bg-ink-surface rounded-2xl shadow-2xl border border-border-subtle max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.confirmStyle === 'danger' ? 'bg-danger/15' :
                confirmModal.confirmStyle === 'success' ? 'bg-success/15' :
                  'bg-accent/15'
                }`}>
                {confirmModal.confirmStyle === 'danger' ? (
                  <AlertCircle className="w-7 h-7 text-danger" />
                ) : confirmModal.confirmStyle === 'success' ? (
                  <CheckCircle className="w-7 h-7 text-success" />
                ) : (
                  <PlayCircle className="w-7 h-7 text-accent" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-text-primary text-center">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-text-secondary text-center mt-2">
                {confirmModal.message}
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary bg-ink-elevated rounded-xl hover:bg-ink transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  closeConfirmModal();
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${confirmModal.confirmStyle === 'danger'
                  ? 'bg-danger text-white hover:bg-danger/90'
                  : confirmModal.confirmStyle === 'success'
                    ? 'bg-success text-text-primary hover:bg-success/90'
                    : 'bg-accent text-text-onAccent hover:shadow-glow'
                  }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETA 编辑模态框 */}
      {showEtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !savingEta && setShowEtaModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-ink-surface rounded-2xl shadow-2xl border border-border-subtle max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-accent/15">
                <Timer className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary text-center">
                设置预计完成时间
              </h3>
              <p className="text-sm text-text-secondary text-center mt-2">
                选择订单预计完成的日期和时间
              </p>
            </div>

            {/* Form */}
            <div className="px-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">日期</label>
                <input
                  type="date"
                  value={etaDate}
                  onChange={(e) => setEtaDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-border-subtle bg-ink-elevated text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">时间</label>
                <input
                  type="time"
                  value={etaTime}
                  onChange={(e) => setEtaTime(e.target.value)}
                  className="w-full px-4 py-3 border border-border-subtle bg-ink-elevated text-text-primary rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-4 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEtaModal(false)}
                  disabled={savingEta}
                  className="flex-1 px-4 py-3 text-sm font-medium text-text-secondary bg-ink-elevated rounded-xl hover:bg-ink transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEta}
                  disabled={savingEta}
                  className="flex-1 px-4 py-3 text-sm font-medium rounded-xl bg-accent text-text-onAccent hover:shadow-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingEta ? (
                    <>
                      <div className="w-4 h-4 border-2 border-text-onAccent border-t-transparent rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
              <button
                onClick={handleResetEta}
                disabled={savingEta}
                className="w-full px-4 py-2.5 text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                恢复系统自动计算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
