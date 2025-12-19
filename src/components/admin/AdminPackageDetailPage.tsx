/**
 * Admin Package Detail Page
 * 
 * Displays detailed package information with purchase history.
 * 
 * Phase 3.4: Admin Package Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPackageById,
  getPackagePurchaseHistory,
  type Package,
  type UserPackage,
} from '@/services/adminPackageService';

interface AdminPackageDetailPageProps {
  packageId: string;
}

export default function AdminPackageDetailPage({ packageId }: AdminPackageDetailPageProps) {
  const router = useRouter();

  const [pkg, setPackage] = useState<Package | null>(null);
  const [purchases, setPurchases] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [packageId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [pkgResult, purchasesResult] = await Promise.all([
      getPackageById(packageId),
      getPackagePurchaseHistory({ packageId }),
    ]);

    if (pkgResult.error || !pkgResult.package) {
      setError(pkgResult.error || 'Package not found');
    } else {
      setPackage(pkgResult.package);
    }

  if (!purchasesResult.error && purchasesResult.data) {
      setPurchases(purchasesResult.data);
    }

    setLoading(false);
  };

  /**
   * 统一金额显示（兼容 Prisma Decimal / string / number）
   */
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    if (Number.isNaN(numeric)) return 'RM 0.00';
    return `RM ${numeric.toFixed(2)}`;
  };
  const formatDate = (date: string) => new Date(date).toLocaleString('zh-CN');

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-elevated flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-ink-elevated p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-danger/15 border border-danger/40 rounded-lg p-4">
            <p className="text-danger">{error}</p>
          </div>
          <button
            onClick={() => router.push('/admin/packages')}
            className="mt-4 text-accent hover:text-accent/80"
          >
            ← 返回套餐列表
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = purchases.reduce(
    (sum, p) => sum + Number((p as any)?.package?.price ?? 0),
    0
  );
  const activePurchases = purchases.filter(p => p.remaining > 0 && new Date(p.expiry) > new Date());

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/admin/packages')}
          className="text-text-secondary hover:text-text-primary mb-4 flex items-center text-sm"
        >
          ← 返回套餐列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{pkg.name}</h1>
                  {pkg.description && <p className="text-text-secondary mt-2">{pkg.description}</p>}
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  pkg.active ? 'bg-success/15 text-success' : 'bg-ink-elevated text-text-secondary'
                }`}>
                  {pkg.active ? '上架中' : '已下架'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-tertiary">包含次数</p>
                  <p className="text-xl font-bold text-text-primary">{pkg.times} 次</p>
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">有效期</p>
                  <p className="text-xl font-bold text-text-primary">{pkg.validity_days} 天</p>
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">套餐价格</p>
                  <p className="text-xl font-bold text-accent">
                    {formatCurrency((pkg as any).price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">平均每次</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(Number((pkg as any).price ?? 0) / pkg.times)}
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">购买记录 ({purchases.length})</h2>
              
              {purchases.length === 0 ? (
                <p className="text-text-tertiary text-center py-8">暂无购买记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-ink-elevated">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">用户</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">购买时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">剩余次数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">到期时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">状态</th>
                      </tr>
                    </thead>
                    <tbody className="bg-ink-surface divide-y divide-border-subtle">
                      {purchases.map((purchase) => {
                        const isExpired = new Date(purchase.expiry) < new Date();
                        const isActive = purchase.remaining > 0 && !isExpired;
                        
                        return (
                          <tr key={purchase.id} className="hover:bg-ink-elevated">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-text-primary">{purchase.user?.full_name}</p>
                                <p className="text-xs text-text-tertiary">{purchase.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {formatDate(purchase.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                              {purchase.remaining} / {pkg.times}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {formatDate(purchase.expiry)}
                            </td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="px-2 py-1 text-xs font-medium bg-success/15 text-success rounded-full">
                                  使用中
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-1 text-xs font-medium bg-ink-elevated text-text-secondary rounded-full">
                                  已过期
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-info-soft text-info rounded-full">
                                  已用完
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-text-secondary mb-4">销售统计</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-tertiary">总销售量</p>
                  <p className="text-2xl font-bold text-text-primary">{purchases.length}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">总收入</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">活跃用户</p>
                  <p className="text-xl font-bold text-info">{activePurchases.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-ink-surface rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-text-secondary mb-4">时间信息</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-text-tertiary">创建时间</p>
                  <p className="text-text-primary">{formatDate(pkg.created_at)}</p>
                </div>
                {pkg.updated_at && (
                  <div>
                    <p className="text-text-tertiary">最后更新</p>
                    <p className="text-text-primary">{formatDate(pkg.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
