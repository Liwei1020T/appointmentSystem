/**
 * 库存变动历史组件 (Stock History Component)
 * 
 * 功能：
 * - 显示库存变动记录
 * - 按时间排序
 * - 支持按球线筛选
 * - 显示操作人和变动原因
 */

'use client';

import { useEffect, useState } from 'react';
import { History, Package, TrendingDown, TrendingUp, RefreshCw, Filter } from 'lucide-react';
import { getStockHistory, type StockHistoryEntry } from '@/services/inventoryService';
import SectionLoading from '@/components/loading/SectionLoading';

interface StockHistoryProps {
  stringId?: string; // 如果提供，只显示该球线的历史
  limit?: number; // 显示条目限制，默认 50
}

export default function StockHistory({ stringId, limit = 50 }: StockHistoryProps) {
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载历史记录
  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    const { history: data, error: err } = await getStockHistory(stringId, limit);

    if (err) {
      setError(typeof err === 'string' ? err : '加载失败');
      setLoading(false);
      return;
    }

    setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [stringId, limit]);

  // 获取变动类型显示名称
  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      order_deduction: '订单使用',
      manual_deduction: '手动扣减',
      restock: '补货',
      adjustment: '库存调整',
      return: '退货',
    };
    return typeMap[type] || type;
  };

  // 获取变动类型颜色
  const getTypeColor = (type: string) => {
    if (type === 'restock' || type === 'return') return 'text-success bg-success/10';
    if (type === 'order_deduction' || type === 'manual_deduction') return 'text-danger bg-danger/10';
    return 'text-info bg-info-soft';
  };

  // 格式化日期
  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return '未知时间';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-ink-surface rounded-lg border border-border-subtle">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">库存变动历史</h3>
          {!loading && history.length > 0 && (
            <span className="text-sm text-text-tertiary">({history.length} 条记录)</span>
          )}
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2 hover:bg-ink-elevated rounded-lg transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <SectionLoading label="加载中..." minHeightClassName="min-h-[180px]" />
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && history.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">暂无库存变动记录</p>
        </div>
      )}

      {/* 历史记录列表 */}
      {!loading && !error && history.length > 0 && (
        <div className="divide-y divide-border-subtle">
          {history.map((log) => {
            const quantityChange = log.quantity_change ?? log.change ?? 0;
            const quantityBefore = log.quantity_before ?? 0;
            const quantityAfter = log.quantity_after ?? 0;
            return (
            <div key={log.id} className="px-6 py-4 hover:bg-ink-elevated transition-colors">
              <div className="flex items-start gap-4">
                {/* 变动图标 */}
                <div className="mt-1">
                  {quantityChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-danger" />
                  )}
                </div>

                {/* 主要信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* 变动类型标签 */}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(log.type)}`}
                    >
                      {getTypeLabel(log.type)}
                    </span>

                    {/* 球线名称（如果不是单个球线查看） */}
                    {!stringId && log.string && (
                      <span className="text-sm font-medium text-text-primary">
                        {log.string.brand} {log.string.model}
                      </span>
                    )}

                    {/* 时间 */}
                    <span className="text-xs text-text-tertiary">{formatDate(log.created_at)}</span>
                  </div>

                  {/* 数量变化 */}
                  <div className="flex items-center gap-3 text-sm mb-1">
                    <span className="text-text-secondary">
                      库存：{quantityBefore} →{' '}
                      <span
                        className={`font-semibold ${
                          quantityChange > 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {quantityAfter}
                      </span>
                    </span>
                    <span
                      className={`font-medium ${
                        quantityChange > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      ({quantityChange > 0 ? '+' : ''}
                      {quantityChange})
                    </span>
                  </div>

                  {/* 备注 */}
                  {(log.notes || log.reason) && (
                    <p className="text-sm text-text-secondary mb-1">
                      <span className="font-medium">说明：</span>
                      {log.notes || log.reason}
                    </p>
                  )}

                  {/* 操作人 */}
                  {log.creator && (
                    <p className="text-xs text-text-tertiary">
                      操作人：{log.creator.full_name || log.creator.fullName || '未知'}
                    </p>
                  )}

                  {/* 关联订单 */}
                  {(log.reference_id || log.referenceId) && log.type === 'order_deduction' && (
                    <p className="text-xs text-text-tertiary">订单ID：{log.reference_id || log.referenceId}</p>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* 底部提示 */}
      {!loading && !error && history.length >= limit && (
        <div className="px-6 py-3 bg-ink-elevated border-t border-border-subtle text-center">
          <p className="text-xs text-text-tertiary">仅显示最近 {limit} 条记录</p>
        </div>
      )}
    </div>
  );
}
