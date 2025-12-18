/**
 * 套餐摘要组件 (Package Summary)
 * 
 * 显示用户已购套餐及剩余次数
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Spinner } from '@/components';
import { getUserPackageSummary } from '@/services/package.service';
import { UserPackage } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PackageSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [packages, setPackages] = useState<UserPackage[]>([]);

  useEffect(() => {
    loadPackageSummary();
  }, []);

  const loadPackageSummary = async () => {
    setLoading(true);
    const { summary, error } = await getUserPackageSummary();

    if (error) {
      console.error('Error loading package summary:', error);
      setLoading(false);
      return;
    }

    if (summary) {
      setTotalRemaining(summary.totalRemaining);
      setPackages(summary.packages);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <Spinner size="medium" />
        </div>
      </Card>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">我的套餐</h2>
          </div>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-slate-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-4">您还没有购买套餐</p>
            <button
              onClick={() => router.push('/packages')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              立即购买套餐 →
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">我的套餐</h2>
            <button
              onClick={() => router.push('/profile/packages')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部
            </button>
        </div>

        {/* 总剩余次数 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">剩余次数</p>
              <p className="text-3xl font-bold text-blue-600">{totalRemaining}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* 套餐列表 */}
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-slate-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-slate-900">
                    {pkg.package?.name || '套餐'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    已使用 {(pkg.package?.times || 0) - pkg.remaining}/{pkg.package?.times || 0} 次
                  </p>
                </div>
                <Badge variant="blue">
                  剩余 {pkg.remaining}
                </Badge>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((pkg.package?.times || 0) - pkg.remaining) / (pkg.package?.times || 1) * 100}%`,
                  }}
                />
              </div>

              {/* 过期时间 */}
              {pkg.expires_at && (
                <p className="text-xs text-slate-500">
                  有效期至: {formatDate(pkg.expires_at)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
