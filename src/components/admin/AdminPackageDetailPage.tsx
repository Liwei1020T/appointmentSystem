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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push('/admin/packages')}
            className="mt-4 text-purple-600 hover:text-purple-700"
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/admin/packages')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center text-sm"
        >
          ← 返回套餐列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{pkg.name}</h1>
                  {pkg.description && <p className="text-gray-600 mt-2">{pkg.description}</p>}
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  pkg.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {pkg.active ? '上架中' : '已下架'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">包含次数</p>
                  <p className="text-xl font-bold text-gray-900">{pkg.times} 次</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">有效期</p>
                  <p className="text-xl font-bold text-gray-900">{pkg.validity_days} 天</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">套餐价格</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency((pkg as any).price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">平均每次</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(Number((pkg as any).price ?? 0) / pkg.times)}
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">购买记录 ({purchases.length})</h2>
              
              {purchases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无购买记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">购买时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">剩余次数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchases.map((purchase) => {
                        const isExpired = new Date(purchase.expiry) < new Date();
                        const isActive = purchase.remaining > 0 && !isExpired;
                        
                        return (
                          <tr key={purchase.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{purchase.user?.full_name}</p>
                                <p className="text-xs text-gray-500">{purchase.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatDate(purchase.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {purchase.remaining} / {pkg.times}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatDate(purchase.expiry)}
                            </td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  使用中
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  已过期
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">销售统计</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">总销售量</p>
                  <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">总收入</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">活跃用户</p>
                  <p className="text-xl font-bold text-blue-600">{activePurchases.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">时间信息</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">创建时间</p>
                  <p className="text-gray-900">{formatDate(pkg.created_at)}</p>
                </div>
                {pkg.updated_at && (
                  <div>
                    <p className="text-gray-500">最后更新</p>
                    <p className="text-gray-900">{formatDate(pkg.updated_at)}</p>
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
