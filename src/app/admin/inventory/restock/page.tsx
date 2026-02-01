'use client';

/**
 * Admin Restock Suggestions Page
 *
 * 智能补货建议页面
 * - 基于销售数据和库存水平的智能分析
 * - 按优先级展示补货建议
 * - 预估成本和利润
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge, Toast } from '@/components';
import { SkeletonCard } from '@/components/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, AlertTriangle, TrendingUp, Package } from 'lucide-react';

interface RestockSuggestion {
  stringId: string;
  brand: string;
  model: string;
  currentStock: number;
  minimumStock: number;
  avgDailySales: number;
  daysUntilStockout: number | null;
  suggestedQuantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedCost: number;
  estimatedProfit: number;
  lastRestockDate: string | null;
}

interface RestockData {
  totalItems: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalEstimatedCost: number;
  suggestions: RestockSuggestion[];
}

export default function AdminRestockPage() {
  const router = useRouter();
  const [data, setData] = useState<RestockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/inventory/restock');
      if (!response.ok) {
        throw new Error('Failed to fetch restock suggestions');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching restock data:', err);
      setError('加载补货建议失败');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: RestockSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error" size="sm">紧急</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">高优先级</Badge>;
      case 'medium':
        return <Badge variant="info" size="sm">中优先级</Badge>;
      case 'low':
        return <Badge variant="neutral" size="sm">低优先级</Badge>;
    }
  };

  const formatDays = (days: number | null) => {
    if (days === null) return '—';
    if (days <= 0) return '已缺货';
    if (days <= 3) return `${days} 天`;
    if (days <= 7) return `${days} 天`;
    return `${days} 天`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
          <h1 className="text-2xl font-bold text-white mt-4 mb-6">智能补货建议</h1>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
          <div className="mt-8 text-center text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> 返回库存管理
            </Button>
            <h1 className="text-2xl font-bold text-white mt-2">智能补货建议</h1>
            <p className="text-text-tertiary text-sm mt-1">
              基于过去 30 天销售数据分析
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            刷新数据
          </Button>
        </div>

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
              <p className="text-xs text-red-300 mb-1">紧急</p>
              <p className="text-2xl font-bold text-red-400">{data.criticalCount}</p>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
              <p className="text-xs text-amber-300 mb-1">高优先级</p>
              <p className="text-2xl font-bold text-amber-400">{data.highCount}</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
              <p className="text-xs text-blue-300 mb-1">中优先级</p>
              <p className="text-2xl font-bold text-blue-400">{data.mediumCount}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">预估总成本</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(data.totalEstimatedCost)}
              </p>
            </div>
          </div>
        )}

        {/* Suggestions List */}
        <div className="space-y-4">
          {data?.suggestions.length === 0 && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-8 text-center">
              <Package className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-400 mb-1">库存充足</h3>
              <p className="text-text-tertiary">当前没有需要补货的商品</p>
            </div>
          )}

          {data?.suggestions.map((item) => (
            <div
              key={item.stringId}
              className={`bg-gray-800 rounded-xl border ${
                item.priority === 'critical'
                  ? 'border-red-600/50'
                  : item.priority === 'high'
                  ? 'border-amber-600/50'
                  : 'border-gray-700'
              } p-5`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* 商品信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityBadge(item.priority)}
                    <span className="text-lg font-semibold text-white">
                      {item.brand} {item.model}
                    </span>
                  </div>
                  <p className="text-sm text-text-tertiary mb-3">{item.reason}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-text-secondary">当前库存</p>
                      <p className={`font-mono ${
                        item.currentStock === 0 ? 'text-red-400' : 'text-white'
                      }`}>
                        {item.currentStock} 件
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">日均销量</p>
                      <p className="font-mono text-white">{item.avgDailySales}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">预计缺货</p>
                      <p className={`font-mono ${
                        item.daysUntilStockout !== null && item.daysUntilStockout <= 3
                          ? 'text-red-400'
                          : item.daysUntilStockout !== null && item.daysUntilStockout <= 7
                          ? 'text-amber-400'
                          : 'text-white'
                      }`}>
                        {formatDays(item.daysUntilStockout)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary">建议补货</p>
                      <p className="font-mono text-accent font-bold">
                        {item.suggestedQuantity} 件
                      </p>
                    </div>
                  </div>
                </div>

                {/* 成本预估 */}
                <div className="sm:text-right sm:min-w-[140px]">
                  <div className="mb-2">
                    <p className="text-xs text-text-secondary">预估成本</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(item.estimatedCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">预估利润</p>
                    <p className="text-sm font-medium text-green-400">
                      +{formatCurrency(item.estimatedProfit)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push(`/admin/inventory/${item.stringId}`)}
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-text-tertiary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            分析说明
          </h4>
          <ul className="text-sm text-text-tertiary space-y-2">
            <li>• <strong>紧急</strong>：库存已清空或 3 天内将缺货</li>
            <li>• <strong>高优先级</strong>：库存低于安全线或 7 天内将缺货</li>
            <li>• <strong>中优先级</strong>：库存接近安全线或 14 天内将缺货</li>
            <li>• 建议补货量基于 14 天缓冲期 + 安全库存计算</li>
            <li>• 预估利润 = 建议数量 × (售价 - 成本价)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
