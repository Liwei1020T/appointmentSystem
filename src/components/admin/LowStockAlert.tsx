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
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock === 1) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-900">
            库存预警
            {!loading && lowStockStrings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-yellow-700">
                ({lowStockStrings.length} 种球线库存不足)
              </span>
            )}
          </h3>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={loadLowStockStrings}
          disabled={loading}
          className="p-1 hover:bg-yellow-100 rounded transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 text-yellow-700 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-4 text-yellow-700">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">加载中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="text-center py-4 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 低库存列表 */}
      {!loading && !error && lowStockStrings.length > 0 && (
        <div className="space-y-2">
          {lowStockStrings.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-yellow-200 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              {/* 球线信息 */}
              <div className="flex items-center gap-3 flex-1">
                <Package className="w-5 h-5 text-gray-400" />
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.brand} {item.model}
                  </div>
                  <div className="text-sm text-gray-500">{item.model}</div>
                </div>

                {/* 当前库存 */}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStockColor(item.stock)}`}>
                    {item.stock}
                  </div>
                  <div className="text-xs text-gray-500">当前库存</div>
                </div>

                {/* 成本价（可选） */}
                {item.costPrice && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700">
                      RM {Number(item.costPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">成本价</div>
                  </div>
                )}
              </div>

              {/* 补货按钮 */}
              <button
                onClick={() => onRestockClick?.(item.id)}
                className="ml-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                立即补货
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      {!loading && !error && lowStockStrings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-xs text-yellow-700">
            <strong>提示：</strong>
            当球线库存低于 {threshold} 时会显示预警。建议及时补货以确保正常营业。
          </p>
        </div>
      )}
    </div>
  );
}
