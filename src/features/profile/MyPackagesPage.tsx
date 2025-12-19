/**
 * 我的套餐页面 (My Packages Page)
 * 
 * 显示用户购买的套餐、剩余次数和使用记录
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Package,
  Calendar,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  History,
} from 'lucide-react';

interface UserPackage {
  id: string;
  package_id: string;
  remaining_uses: number;
  expiry_date: string;
  created_at: string;
  package: {
    id: string;
    name: string;
    total_uses: number;
    price: number;
    validity_days: number;
  };
}

interface PackageUsageLog {
  id: string;
  used_at: string;
  order: {
    order_number: string;
    string: {
      brand: string;
      model: string;
    };
  };
}

export default function MyPackagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;

  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<UserPackage | null>(null);
  const [usageLogs, setUsageLogs] = useState<PackageUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsageHistory, setShowUsageHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPackages();
  }, [isAuthenticated]);

  const loadPackages = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/packages/my');
      const data = await response.json();
      
      if (response.ok && data.packages) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    }

    setLoading(false);
  };

  const loadUsageHistory = async (packageId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}/usage`);
      const result = await response.json();
      
      if (response.ok && result.usage) {
        setUsageLogs(result.usage);
      }
    } catch (error) {
      console.error('Failed to load usage history:', error);
    }
  };

  const handleViewHistory = (pkg: UserPackage) => {
    setSelectedPackage(pkg);
    loadUsageHistory(pkg.id);
    setShowUsageHistory(true);
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPackageStatus = (pkg: UserPackage) => {
    const daysRemaining = getDaysRemaining(pkg.expiry_date);

    if (daysRemaining < 0) {
      return {
        label: '已过期',
        color: 'bg-danger/15 text-danger border-danger/40',
        icon: <AlertCircle className="w-4 h-4" />,
      };
    } else if (daysRemaining <= 7) {
      return {
        label: `即将过期 (${daysRemaining}天)`,
        color: 'bg-warning/15 text-warning border-warning/40',
        icon: <Clock className="w-4 h-4" />,
      };
    } else {
      return {
        label: '使用中',
        color: 'bg-success/15 text-success border-success/40',
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">我的套餐</h1>
          <p className="text-text-secondary">查看和管理您购买的套餐</p>
        </div>

        {/* 套餐列表 */}
        {packages.length === 0 ? (
          <div className="bg-ink-surface rounded-lg shadow-sm border border-border-subtle p-12 text-center">
            <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无套餐</h3>
            <p className="text-text-secondary mb-6">购买套餐享受更多优惠</p>
            <button
              onClick={() => router.push('/packages')}
              className="px-6 py-2 bg-accent hover:shadow-glow text-text-onAccent rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              购买套餐
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg) => {
              const status = getPackageStatus(pkg);
              const usagePercentage =
                ((pkg.package.total_uses - pkg.remaining_uses) / pkg.package.total_uses) * 100;

              return (
                <div
                  key={pkg.id}
                  className="bg-ink-surface rounded-lg shadow-sm border-2 hover:shadow-md transition-shadow overflow-hidden"
                  style={{
                    borderColor:
                      status.label === '已过期'
                        ? '#fee2e2'
                        : status.label.includes('即将过期')
                        ? '#fef3c7'
                        : '#dcfce7',
                  }}
                >
                  {/* 套餐头部 */}
                  <div className="bg-gradient-to-r from-accent/30 to-ink-elevated p-6 text-text-primary">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{pkg.package.name}</h3>
                        <p className="text-text-tertiary text-sm">
                          购于 {formatDate(pkg.created_at)}
                        </p>
                      </div>
                      <Package className="w-8 h-8 opacity-80" />
                    </div>

                    {/* 剩余次数 */}
                    <div className="bg-ink-surface/20 rounded-lg p-4">
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-4xl font-bold">{pkg.remaining_uses}</span>
                        <span className="text-text-tertiary text-sm">
                          / {pkg.package.total_uses} 次
                        </span>
                      </div>
                      <div className="w-full bg-ink-surface/30 rounded-full h-2">
                        <div
                          className="bg-ink-surface h-2 rounded-full transition-all"
                          style={{ width: `${100 - usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 套餐详情 */}
                  <div className="p-6">
                    {/* 状态标签 */}
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    {/* 信息卡片 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-ink-elevated p-3 rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">有效期至</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatDate(pkg.expiry_date)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          剩余 {getDaysRemaining(pkg.expiry_date)} 天
                        </p>
                      </div>

                      <div className="bg-ink-elevated p-3 rounded-lg border border-border-subtle">
                        <div className="flex items-center gap-2 text-text-secondary mb-1">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs">已使用</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">
                          {pkg.package.total_uses - pkg.remaining_uses} 次
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {usagePercentage.toFixed(0)}% 已用
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push('/booking?use_package=true')}
                        className="flex-1 px-4 py-2 bg-accent hover:shadow-glow text-text-onAccent rounded-lg font-medium transition-colors"
                      >
                        立即使用
                      </button>
                      <button
                        onClick={() => handleViewHistory(pkg)}
                        className="px-4 py-2 border border-border-subtle hover:bg-ink-elevated text-text-secondary rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        使用记录
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 购买更多 */}
        {packages.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/packages')}
              className="px-6 py-3 bg-ink-surface border-2 border-accent hover:bg-ink-elevated text-accent rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              购买更多套餐
            </button>
          </div>
        )}

        {/* 使用记录模态框 */}
        {showUsageHistory && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-surface rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* 头部 */}
              <div className="p-6 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">使用记录</h3>
                    <p className="text-sm text-text-secondary">{selectedPackage.package.name}</p>
                  </div>
                  <button
                    onClick={() => setShowUsageHistory(false)}
                    className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 overflow-y-auto max-h-96">
                {usageLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-secondary">暂无使用记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usageLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-ink-elevated rounded-lg hover:bg-ink-surface transition-colors border border-border-subtle"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            订单 #{log.order.order_number}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {log.order.string.brand} {log.order.string.model}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">
                            {formatDate(log.used_at)}
                          </p>
                          <CheckCircle2 className="w-5 h-5 text-success ml-auto mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className="p-6 border-t border-border-subtle">
                <button
                  onClick={() => setShowUsageHistory(false)}
                  className="w-full px-4 py-2 bg-ink-elevated hover:bg-ink-surface text-text-secondary rounded-lg font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
