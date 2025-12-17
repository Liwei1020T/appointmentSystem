/**
 * 积分历史页面组件 (Points History Page Component)
 * 
 * 功能：
 * - 显示用户当前积分余额
 * - 按类型筛选积分记录（全部、获得、消费、退款、过期）
 * - 显示每条记录的详情（金额、类型、时间、余额）
 * - 空状态引导用户如何赚取积分
 */

'use client';

import { useEffect, useState } from 'react';
import { getPointsBalance, getPointsHistory } from '@/services/pointsService';
import type { PointsLog, PointsLogType } from '@/services/pointsService';

type FilterType = 'all' | PointsLogType;

export default function PointsHistoryPage() {
  const [balance, setBalance] = useState<number>(0);
  const [logs, setLogs] = useState<PointsLog[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // 获取积分余额
    const { balance: currentBalance, error: balanceError } = await getPointsBalance();
    if (balanceError) {
      setError(balanceError);
      setLoading(false);
      return;
    }

    setBalance(currentBalance || 0);

    // 获取积分记录
    const filterType = filter === 'all' ? undefined : filter;
    const { logs: historyLogs, error: logsError } = await getPointsHistory(filterType, 50);

    if (logsError) {
      setError(logsError);
    } else {
      setLogs(historyLogs || []);
    }

    setLoading(false);
  };

  const getTypeIcon = (type: PointsLogType) => {
    switch (type) {
      case 'earn':
        return '💰';
      case 'spend':
        return '🎁';
      case 'expire':
        return '⏰';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: PointsLogType) => {
    switch (type) {
      case 'earn':
        return '获得';
      case 'spend':
        return '消费';
      case 'expire':
        return '过期';
      default:
        return type;
    }
  };

  const getAmountColor = (type: PointsLogType) => {
    switch (type) {
      case 'earn':
        return 'text-green-600';
      case 'spend':
      case 'expire':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return '未知时间';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const filters: { type: FilterType; label: string }[] = [
    { type: 'all', label: '全部' },
    { type: 'earn', label: '获得' },
    { type: 'spend', label: '消费' },
    { type: 'expire', label: '过期' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">我的积分</h1>
        </div>
      </div>

      {/* 积分余额卡片 */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">当前积分</div>
          <div className="text-4xl font-bold mb-1">{balance}</div>
          <div className="text-xs opacity-75">可用于兑换优惠券</div>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.type}
              onClick={() => setFilter(f.type)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.type
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 积分记录列表 */}
      <div className="px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-gray-600 mb-2">暂无积分记录</p>
            <p className="text-sm text-gray-500">完成订单即可赚取积分</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getTypeIcon(log.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {getTypeLabel(log.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(log.created_at)}</span>
                        <span>•</span>
                        <span>余额: {log.balance_after}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ml-2 ${getAmountColor(log.type)}`}>
                    <div className="text-lg font-bold">
                      {log.type === 'earn' ? '+' : '-'}
                      {log.amount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 提示卡片 */}
      {!loading && !error && logs.length > 0 && (
        <div className="px-4 mt-6 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div className="flex-1 text-sm">
                <p className="text-blue-900 font-medium mb-1">如何赚取积分？</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• 完成订单：每消费 RM 1 = 1 积分</li>
                  <li>• 邀请好友：好友首单完成获得 50 积分</li>
                  <li>• 评价订单：每次评价获得 10 积分</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
