'use client';

/**
 * Admin Reports Page
 * 
 * Comprehensive analytics dashboard for business insights:
 * - Revenue and profit analysis with charts
 * - Sales statistics and trends
 * - Top performing products
 * - User growth metrics
 * - Order patterns and trends
 * - Data export capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  getRevenueReport,
  getProfitAnalysis,
  getSalesStats,
  getTopStrings,
  getTopPackages,
  getUserGrowthStats,
  getOrderTrends,
  exportReportData,
  DateRange,
  RevenueReport,
  ProfitAnalysis,
  SalesStats,
  TopString,
  TopPackage,
  UserGrowthStats,
  OrderTrends,
} from '@/services/adminReportsService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminReportsPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Data state
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [topStrings, setTopStrings] = useState<TopString[]>([]);
  const [topPackages, setTopPackages] = useState<TopPackage[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthStats | null>(null);
  const [orderTrends, setOrderTrends] = useState<OrderTrends | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'trends'>('overview');

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  async function loadAllData() {
    setLoading(true);
    setError(null);

    try {
      const [
        revenueRes,
        profitRes,
        salesRes,
        stringsRes,
        packagesRes,
        userRes,
        trendsRes,
      ] = await Promise.all([
        getRevenueReport(dateRange),
        getProfitAnalysis(dateRange),
        getSalesStats(dateRange),
        getTopStrings(10, dateRange),
        getTopPackages(10, dateRange),
        getUserGrowthStats(30),
        getOrderTrends(dateRange),
      ]);

      if (revenueRes.error) throw new Error(revenueRes.error);
      if (profitRes.error) throw new Error(profitRes.error);
      if (salesRes.error) throw new Error(salesRes.error);
      if (stringsRes.error) throw new Error(stringsRes.error);
      if (packagesRes.error) throw new Error(packagesRes.error);
      if (userRes.error) throw new Error(userRes.error);
      if (trendsRes.error) throw new Error(trendsRes.error);

      setRevenueReport(revenueRes.data);
      setProfitAnalysis(profitRes.data);
      setSalesStats(salesRes.data);
      setTopStrings(stringsRes.data || []);
      setTopPackages(packagesRes.data || []);
      setUserGrowth(userRes.data);
      setOrderTrends(trendsRes.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(reportType: 'revenue' | 'profit' | 'sales' | 'strings' | 'packages' | 'users') {
    try {
      const { data, error } = await exportReportData(reportType, dateRange);
      if (error) throw new Error(error);
      if (!data) throw new Error('No data to export');

      // Download CSV
      // 说明：exportReportData 返回的是 Blob（服务层已调用 response.blob()）
      const blob = data instanceof Blob ? data : new Blob([data as any], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${dateRange.startDate}_${dateRange.endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center text-danger">
          <p className="text-xl font-semibold">Error loading reports</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">📊 Reports & Analytics</h1>
          <p className="mt-2 text-text-secondary">Business insights and performance metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-ink-surface rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setDateRange({
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-ink-elevated hover:bg-ink-elevated rounded-lg"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  setDateRange({
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-ink-elevated hover:bg-ink-elevated rounded-lg"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setMonth(start.getMonth() - 3);
                  setDateRange({
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-ink-elevated hover:bg-ink-elevated rounded-lg"
              >
                Last 3 Months
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border-subtle">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'products', label: 'Products' },
              { id: 'users', label: 'Users' },
              { id: 'trends', label: 'Trends' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium ${activeTab === tab.id
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  RM {revenueReport?.totalRevenue.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Total Profit</p>
                <p className="text-2xl font-bold text-success mt-2">
                  RM {profitAnalysis?.totalProfit.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Margin: {profitAnalysis?.profitMargin.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Total Orders</p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  {salesStats?.totalOrders || 0}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Completion: {salesStats?.completionRate?.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Avg Order Value</p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  RM {revenueReport?.averageOrderValue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Revenue Trend</h2>
                <button
                  onClick={() => handleExport('revenue')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueReport?.revenueByDate || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue (RM)" />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Profit Breakdown */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Profit by Product</h2>
                <button
                  onClick={() => handleExport('profit')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-subtle">
                  <thead>
                    <tr className="bg-ink">
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Profit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ink-surface divide-y divide-border-subtle">
                    {(profitAnalysis?.profitByProduct || [])
                      .sort((a, b) => b.profit - a.profit)
                      .slice(0, 10)
                      .map((product, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-text-primary">
                            {product.productName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${product.productType === 'string'
                                ? 'bg-info-soft text-info'
                                : 'bg-success/15 text-success'
                                }`}
                            >
                              {product.productType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-text-primary">
                            {product.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-text-primary">
                            RM {product.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-text-secondary">
                            RM {product.cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-success">
                            RM {product.profit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-text-primary">
                            {product.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Stats */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Sales Statistics</h2>
                <button
                  onClick={() => handleExport('sales')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-text-secondary">Package Usage Rate</p>
                  <p className="text-xl font-bold text-accent mt-1">
                    {salesStats?.packageUsageRate?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Voucher Usage Rate</p>
                  <p className="text-xl font-bold text-accent mt-1">
                    {salesStats?.voucherUsageRate?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Completion Rate</p>
                  <p className="text-xl font-bold text-success mt-1">
                    {salesStats?.completionRate?.toFixed(1) || '0'}%
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={salesStats?.ordersByStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(salesStats?.ordersByStatus || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Strings */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Top Selling Strings</h2>
                <button
                  onClick={() => handleExport('strings')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-subtle">
                  <thead>
                    <tr className="bg-ink">
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        String Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Avg Tension
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ink-surface divide-y divide-border-subtle">
                    {topStrings.map((string, index) => (
                      <tr key={string.stringId}>
                        <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {string.stringName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-primary">
                          {string.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-primary">
                          RM {string.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-secondary">
                          {string.avgTension?.toFixed(1) || '0'} lbs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Packages */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Top Selling Packages</h2>
                <button
                  onClick={() => handleExport('packages')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-subtle">
                  <thead>
                    <tr className="bg-ink">
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">
                        Package Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Sold
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Used
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Revenue
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase">
                        Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ink-surface divide-y divide-border-subtle">
                    {topPackages.map((pkg, index) => (
                      <tr key={pkg.packageId}>
                        <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {pkg.packageName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-primary">
                          {pkg.soldCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-primary">
                          {pkg.usedCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-text-primary">
                          RM {pkg.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${(pkg.utilizationRate || 0) >= 80
                              ? 'bg-success/15 text-success'
                              : (pkg.utilizationRate || 0) >= 50
                                ? 'bg-warning/15 text-warning'
                                : 'bg-danger/15 text-danger'
                              }`}
                          >
                            {pkg.utilizationRate?.toFixed(1) || '0'}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* String Revenue Chart */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                String Revenue Comparison
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topStrings.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stringName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (RM)" />
                  <Bar dataKey="quantity" fill="#10b981" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Growth Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Total Users</p>
                <p className="text-2xl font-bold text-text-primary mt-2">
                  {userGrowth?.totalUsers || 0}
                </p>
              </div>
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">New Users (30 days)</p>
                <p className="text-2xl font-bold text-accent mt-2">
                  {userGrowth?.newUsers || 0}
                </p>
              </div>
              <div className="bg-ink-surface rounded-lg shadow-sm p-6">
                <p className="text-sm text-text-secondary">Growth Rate</p>
                <p className="text-2xl font-bold text-success mt-2">
                  {userGrowth?.growthRate?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">User Growth Trend</h2>
                <button
                  onClick={() => handleExport('users')}
                  className="px-3 py-1 text-sm bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
                >
                  Export CSV
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth?.dailyGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#3b82f6"
                    name="New Users"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativeUsers"
                    stroke="#10b981"
                    name="Total Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* User Acquisition Source */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                User Acquisition Source
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={userGrowth?.usersBySource || []}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.source}: ${entry.percentage?.toFixed(1) || '0'}%`}
                  >
                    {(userGrowth?.usersBySource || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Orders by Hour */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Orders by Hour of Day
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderTrends?.ordersByHour || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Day of Week */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Orders by Day of Week
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderTrends?.ordersByDayOfWeek || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Month */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Monthly Order Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderTrends?.ordersByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    name="Orders"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    name="Revenue (RM)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
