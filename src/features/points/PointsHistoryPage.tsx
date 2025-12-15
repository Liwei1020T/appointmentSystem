/**
 * 积分历史页面 (Points History Page)
 * 
 * 显示用户积分获得和使用记录
 * 包括：积分余额、积分统计、积分历史列表
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getPointsBalance,
  getPointsHistory,
  getPointsStats,
  PointsLog,
  PointsStats,
  PointsLogType,
} from '@/services/pointsService';
import { Card, Spinner, Badge } from '@/components';
import { formatDate } from '@/lib/utils';

export default function PointsHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [logs, setLogs] = useState<PointsLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filterType, setFilterType] = useState<PointsLogType | 'all'>('all');

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 加载数据
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterType]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user?.id) return;

      // 并行加载余额、统计和历史
      const [balanceResult, statsResult, logsResult] = await Promise.all([
        getPointsBalance(user.id),
        getPointsStats(user.id),
        getPointsHistory(filterType === 'all' ? undefined : filterType),
      ]);

      if (balanceResult.error) {
        setError(balanceResult.error);
      } else {
        setBalance(balanceResult.balance);
      }

      // getPointsStats returns PointsStats directly
      setStats(statsResult);

      if (logsResult.error) {
        setError(logsResult.error);
      } else {
        setLogs(logsResult.logs || []);
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取积分类型的显示文本
  const getTypeText = (type: PointsLogType): string => {
    const typeMap: Record<PointsLogType, string> = {
      earn: '获得',
      spend: '消费',
      refund: '退款',
      expire: '过期',
    };
    return typeMap[type];
  };

  // 获取积分类型的颜色
  const getTypeColor = (type: PointsLogType): string => {
    const colorMap: Record<PointsLogType, string> = {
      earn: 'green',
      spend: 'red',
      refund: 'blue',
      expire: 'gray',
    };
    return colorMap[type];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">我的积分</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 积分余额卡片 */}
        <Card>
          <div className="p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">当前积分</p>
            <p className="text-5xl font-bold text-blue-600 mb-4">{balance}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => router.push('/vouchers/exchange')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                兑换优惠券
              </button>
            </div>
          </div>
        </Card>

        {/* 积分统计 */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">累计获得</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.total_earned}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">累计消费</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.total_spent}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">累计退款</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_refunded}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* 类型筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilterType('earn')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'earn'
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            获得
          </button>
          <button
            onClick={() => setFilterType('spend')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'spend'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            消费
          </button>
          <button
            onClick={() => setFilterType('refund')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'refund'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            退款
          </button>
        </div>

        {/* 积分历史列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">积分记录</h2>

          {logs.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  暂无记录
                </h3>
                <p className="text-slate-600 mb-4">
                  {filterType === 'all'
                    ? '还没有积分记录'
                    : `还没有${getTypeText(filterType as PointsLogType)}记录`}
                </p>
              </div>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getTypeColor(log.type) as any}>
                          {getTypeText(log.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-900 font-medium">
                        {log.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          log.type === 'earn' || log.type === 'refund'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {log.type === 'earn' || log.type === 'refund' ? '+' : '-'}
                        {log.amount}
                      </p>
                      <p className="text-xs text-slate-500">
                        余额: {log.balance_after}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {log.created_at || log.createdAt ? formatDate(log.created_at || log.createdAt!) : '未知'}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 积分规则说明 */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              积分获得规则
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <p>完成订单可获得积分（订单金额 × 10%）</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <p>邀请好友注册可获得 50 积分</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <p>首次购买套餐可获得 100 积分</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 积分用途 */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              积分用途
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>兑换各种优惠券</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>参与积分商城活动</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p>抵扣部分订单金额（即将推出）</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
