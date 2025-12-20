/**
 * 套餐列表页组件 (Packages Page)
 * 
 * 显示所有可购买套餐，支持点击购买
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailablePackages, Package } from '@/services/packageService';
import PackageCard from '@/components/PackageCard';
import Spinner from '@/components/Spinner';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // 加载套餐列表
  const loadPackages = async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await getAvailablePackages();

    if (err) {
      setError(err.message || '加载套餐失败');
      setPackages([]);
    } else {
      setPackages(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  // 处理购买
  const handlePurchase = (pkg: Package) => {
    setSelectedPackage(pkg);
    // 跳转到购买流程页面，携带套餐ID
    router.push(`/packages/purchase?id=${pkg.id}`);
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">购买套餐</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 说明卡片 */}
        <Card className="p-6 bg-ink-elevated border border-border-subtle">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">为什么购买套餐？</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>✓ 价格更优惠，平均每次更便宜</li>
                <li>✓ 无需每次支付，穿线更方便</li>
                <li>✓ 套餐有效期内随时使用</li>
                <li>✓ 可赠送给朋友或家人</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <Card className="p-6 text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button onClick={loadPackages}>重试</Button>
          </Card>
        )}

        {/* 套餐列表 */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onPurchase={handlePurchase}
                showSavings={true}
                averagePrice={50}
              />
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && packages.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-text-tertiary mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">暂无可购买套餐</h3>
            <p className="text-text-secondary">敬请期待更多优惠套餐</p>
          </Card>
        )}

        {/* 底部提示 */}
        <Card className="p-6 bg-ink-elevated border border-border-subtle">
          <h3 className="font-semibold text-text-primary mb-3">购买须知</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>• 套餐购买后不支持退款</li>
            <li>• 套餐在有效期内可随时使用</li>
            <li>• 过期后剩余次数将失效</li>
            <li>• 可在 &quot;我的套餐&quot; 中查看使用记录</li>
            <li>• 如有疑问，请联系客服</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
