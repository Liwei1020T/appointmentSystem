'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge } from '@/components';
import PageHeader from '@/components/layout/PageHeader';
import { apiRequest } from '@/services/apiClient';
import { formatCurrency } from '@/lib/utils';
import LtvChart from '@/components/charts/LtvChart';
import RetentionChart from '@/components/charts/RetentionChart';
import HourlyChart from '@/components/charts/HourlyChart';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiRequest('/api/admin/analytics');
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!stats) return null;

  const { ltv, retention, aovTrend, popularHours } = stats;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader title="业务洞察 Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">总销售额</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-mono">
              {formatCurrency(ltv.totalSales)}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">用户 LTV (生命周期价值)</p>
            <p className="text-3xl font-bold text-accent mt-2 font-mono">
              {formatCurrency(ltv.ltv)}
            </p>
            <p className="text-xs text-gray-400 mt-1">基于 {ltv.totalUsers} 位用户</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">用户留存率</p>
            <p className="text-3xl font-bold text-purple-600 mt-2 font-mono">
              {retention.retentionRate}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {retention.repeatUsers} / {retention.totalOrderingUsers} 回头客
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">总订单数</p>
            <p className="text-3xl font-bold text-blue-600 mt-2 font-mono">
              {aovTrend.reduce((acc: number, curr: any) => acc + curr.orderCount, 0)}
            </p>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AOV Trend (Line Chart) */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">客单价与销售趋势 (12个月)</h3>
            <LtvChart data={aovTrend} />
          </Card>

          {/* Retention (Pie Chart) */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">用户构成</h3>
            <RetentionChart data={retention} />
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">热门下单时段 (小时)</h3>
            <HourlyChart data={popularHours} />
          </Card>
        </div>
      </div>
    </div>
  );
}
