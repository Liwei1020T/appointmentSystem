/**
 * 低库存预警组件 (Low Stock Alert Component)
 * 
 * 功能：
 * - 显示库存不足的球线列表
 * - 提供快速补货入口
 * - 实时更新库存状态
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { checkLowStock, type StringInventory } from '@/services/inventoryService';

interface LowStockAlertProps {
  threshold?: number; // 预警阈值，默认 3
  onRestockClick?: (stringId: string) => void; // 点击补货按钮回调
}

export default function LowStockAlert({ threshold = 3, onRestockClick }: LowStockAlertProps) {
  const [lowStockStrings, setLowStockStrings] = useState<StringInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载低库存球线列表
  const loadLowStockStrings = async () => {
    setLoading(true);
    setError(null);

    const { items, error: err } = await checkLowStock(threshold);

    if (err) {
      setError(err.message || '加载失败');
      setLoading(false);
      return;
    }

    setLowStockStrings(items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLowStockStrings();
  }, [threshold]);

  // 如果没有低库存，不显示组件
  if (!loading && lowStockStrings.length === 0) {
    return null;
  }

  // 获取库存状态颜色
  const getStockColor = (stock: number, minimumStock: number) => {
    if (stock === 0) return 'text-danger';
    if (stock <= minimumStock) return 'text-warning';
    return 'text-warning';
  };

  return (
    <div className="bg-warning/10 border border-warning/40 rounded-lg p-4 mb-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-warning">
            库存预警
            {!loading && lowStockStrings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-text-secondary">
                ({lowStockStrings.length} 种球线库存不足)
              </span>
            )}
          </h3>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={loadLowStockStrings}
          disabled={loading}
          className="p-1 hover:bg-warning/15 rounded transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 text-warning ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-4 text-text-secondary">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">加载中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="text-center py-4 text-danger">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 低库存列表 */}
      {!loading && !error && lowStockStrings.length > 0 && (
        <div className="space-y-2">
          {lowStockStrings.map((item) => (
            <div
              key={item.id}
              className="bg-ink-surface border border-warning/40 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              {/* 球线信息 */}
              <div className="flex items-center gap-3 flex-1">
                <Package className="w-5 h-5 text-text-tertiary" />
                
                <div className="flex-1">
                  <div className="font-medium text-text-primary">
                    {item.brand} {item.model}
                  </div>
                  <div className="text-sm text-text-tertiary">{item.model}</div>
                </div>

                {/* 当前库存 */}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStockColor(item.stock, item.minimumStock)}`}>
                    {item.stock}
                  </div>
                  <div className="text-xs text-text-tertiary">当前库存</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-text-secondary">
                    {item.minimumStock}
                  </div>
                  <div className="text-xs text-text-tertiary">最低库存</div>
                </div>

                {/* 成本价（可选） */}
                {item.costPrice && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-text-secondary">
                      RM {Number(item.costPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-text-tertiary">成本价</div>
                  </div>
                )}
              </div>

              {/* 补货按钮 */}
              <button
                onClick={() => onRestockClick?.(item.id)}
                className="ml-4 px-4 py-2 bg-warning hover:bg-warning/90 text-text-primary rounded-lg text-sm font-medium transition-colors"
              >
                立即补货
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      {!loading && !error && lowStockStrings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-warning/40">
          <p className="text-xs text-text-secondary">
            <strong>提示：</strong>
            当球线库存低于设定的最低库存或预警阈值时会显示预警。建议及时补货以确保正常营业。
          </p>
        </div>
      )}
    </div>
  );
}
