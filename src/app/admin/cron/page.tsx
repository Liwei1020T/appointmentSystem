'use client';

/**
 * AdminCronPage Component
 *
 * Cron 任务监控面板
 * - 查看所有 cron 任务状态
 * - 手动触发任务
 * - 查看相关统计数据
 */

import React, { useState, useEffect } from 'react';
import { Button, Toast } from '@/components';
import { SkeletonCard } from '@/components/Skeleton';

interface CronTask {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  stats: Record<string, number>;
}

interface CronStatusData {
  tasks: CronTask[];
  lastChecked: string;
}

export default function AdminCronPage() {
  const [data, setData] = useState<CronStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/cron/status');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
      setToast({ show: true, message: '加载失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const runTask = async (task: CronTask) => {
    setRunningTask(task.id);
    try {
      const response = await fetch(task.endpoint, {
        method: task.id === 'cleanup-orders' ? 'GET' : 'POST',
      });

      if (!response.ok) {
        throw new Error('Task failed');
      }

      const result = await response.json();
      setToast({
        show: true,
        message: `${task.name} 执行成功`,
        type: 'success',
      });

      // 刷新状态
      fetchStatus();
    } catch (error) {
      console.error('Task execution failed:', error);
      setToast({
        show: true,
        message: `${task.name} 执行失败`,
        type: 'error',
      });
    } finally {
      setRunningTask(null);
    }
  };

  const getStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      pendingOrders: '待处理订单',
      updatedLast24h: '24h 内更新',
      expiringPackages: '即将到期套餐',
      expiredPendingOrders: '超时待支付',
    };
    return labels[key] || key;
  };

  const getTaskIcon = (id: string): string => {
    const icons: Record<string, string> = {
      'order-automation': '🔄',
      'package-renewal': '📦',
      'cleanup-orders': '🗑️',
    };
    return icons[id] || '⚙️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Cron 任务监控</h1>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cron 任务监控</h1>
          {data?.lastChecked && (
            <p className="text-sm text-text-tertiary mt-1">
              最后检查: {new Date(data.lastChecked).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
        >
          刷新状态
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {data?.tasks.map((task) => (
          <div
            key={task.id}
            className="bg-gray-800 rounded-xl border border-gray-700 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getTaskIcon(task.id)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {task.name}
                  </h3>
                  <p className="text-sm text-text-tertiary mt-0.5">
                    {task.description}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 font-mono">
                    {task.endpoint}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => runTask(task)}
                loading={runningTask === task.id}
                disabled={runningTask !== null}
              >
                {runningTask === task.id ? '执行中...' : '手动执行'}
              </Button>
            </div>

            {/* 统计数据 */}
            {Object.keys(task.stats).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(task.stats).map(([key, value]) => (
                    <div key={key} className="bg-gray-700/50 rounded-lg px-4 py-2">
                      <p className="text-xs text-text-tertiary">{getStatLabel(key)}</p>
                      <p className={`text-xl font-bold ${
                        value > 0 ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 p-5">
        <h4 className="text-sm font-semibold text-text-tertiary mb-3">说明</h4>
        <ul className="text-sm text-text-tertiary space-y-2">
          <li>• <strong>订单自动化</strong>：建议每小时运行一次，自动推进订单状态</li>
          <li>• <strong>套餐续费提醒</strong>：建议每天运行一次，提醒用户续费</li>
          <li>• <strong>清理超时订单</strong>：建议每 15 分钟运行一次，释放锁定库存</li>
          <li className="text-text-secondary pt-2">
            提示：生产环境建议使用 Vercel Cron Jobs 或外部调度器自动触发
          </li>
        </ul>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
