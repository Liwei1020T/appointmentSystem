/**
 * 套餐列表页组件 (Packages Page)
 * 
 * 显示所有可购买套餐，支持点击购买
 * 包含：页面动画、骨架屏、套餐对比表
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailablePackages, Package } from '@/services/packageService';
import PackageCard from '@/components/PackageCard';
import Card from '@/components/Card';
import Button from '@/components/Button';

// 骨架屏组件
function PackageCardSkeleton() {
  return (
    <div className="rounded-2xl bg-ink-surface border border-border-subtle p-6 animate-pulse">
      <div className="h-6 bg-ink-elevated rounded w-24 mb-4"></div>
      <div className="h-12 bg-ink-elevated rounded w-16 mb-2"></div>
      <div className="h-4 bg-ink-elevated rounded w-20 mb-4"></div>
      <div className="h-8 bg-ink-elevated rounded w-28 mb-2"></div>
      <div className="h-4 bg-ink-elevated rounded w-32 mb-4"></div>
      <div className="h-16 bg-ink-elevated rounded mb-4"></div>
      <div className="h-4 bg-ink-elevated rounded w-24 mb-4"></div>
      <div className="h-10 bg-ink-elevated rounded"></div>
    </div>
  );
}

// 套餐对比表组件
function PackageComparisonTable({ packages }: { packages: Package[] }) {
  const sortedPackages = [...packages].sort((a, b) => a.times - b.times);
  const averagePrice = 50; // 单次价格

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">对比项</th>
            {sortedPackages.map((pkg) => (
              <th key={pkg.id} className={`text-center py-3 px-4 text-sm font-semibold ${pkg.times === 10 ? 'text-accent bg-accent/5' : 'text-text-primary'}`}>
                {pkg.name}
                {pkg.times === 10 && <span className="block text-xs text-accent">🔥 推荐</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-subtle">
            <td className="py-3 px-4 text-sm text-text-secondary">穿线次数</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className={`text-center py-3 px-4 text-lg font-bold ${pkg.times === 10 ? 'text-accent bg-accent/5' : 'text-text-primary'}`}>
                {pkg.times} 次
              </td>
            ))}
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-3 px-4 text-sm text-text-secondary">总价</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className={`text-center py-3 px-4 font-mono font-bold ${pkg.times === 10 ? 'text-accent bg-accent/5' : 'text-text-primary'}`}>
                RM {Number(pkg.price).toFixed(0)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-3 px-4 text-sm text-text-secondary">单次均价</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className={`text-center py-3 px-4 font-mono ${pkg.times === 10 ? 'bg-accent/5' : ''}`}>
                RM {(Number(pkg.price) / pkg.times).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-3 px-4 text-sm text-text-secondary">节省金额</td>
            {sortedPackages.map((pkg) => {
              const savings = (averagePrice * pkg.times) - Number(pkg.price);
              return (
                <td key={pkg.id} className={`text-center py-3 px-4 font-semibold text-success ${pkg.times === 10 ? 'bg-accent/5' : ''}`}>
                  RM {savings.toFixed(0)}
                </td>
              );
            })}
          </tr>
          <tr className="border-b border-border-subtle">
            <td className="py-3 px-4 text-sm text-text-secondary">有效期</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className={`text-center py-3 px-4 ${pkg.times === 10 ? 'bg-accent/5' : ''}`}>
                {pkg.validityDays} 天
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 px-4 text-sm text-text-secondary">性价比</td>
            {sortedPackages.map((pkg, index) => {
              const stars = index === 0 ? '⭐⭐' : index === 1 ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐';
              return (
                <td key={pkg.id} className={`text-center py-3 px-4 ${pkg.times === 10 ? 'bg-accent/5' : ''}`}>
                  {stars}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 页面进入动画
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    router.push(`/packages/purchase?id=${pkg.id}`);
  };

  return (
    <div className="min-h-screen bg-ink relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
      </div>

      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`
            text-lg font-semibold text-text-primary
            transition-all duration-500
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}>
            购买套餐
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 relative z-1">
        {/* 页面标题区 - 带动画 */}
        <div className={`
          text-center py-6
          transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <h2 className="text-3xl font-bold text-text-primary mb-2">选择您的套餐</h2>
          <p className="text-text-secondary">购买套餐，享受更多优惠</p>
        </div>

        {/* 说明卡片 - 带动画 */}
        <div className={`
          transition-all duration-700 ease-out delay-100
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <Card className="p-6 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-3">为什么购买套餐？</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-success">✓</span> 价格更优惠
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-success">✓</span> 无需每次支付
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-success">✓</span> 有效期内随用
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="text-success">✓</span> 可赠送分享
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 对比表格切换按钮 */}
        {!loading && packages.length > 1 && (
          <div className={`
            flex justify-center
            transition-all duration-700 ease-out delay-150
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              {showComparison ? '隐藏对比表' : '查看套餐对比'}
              <svg className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* 套餐对比表 */}
        {showComparison && packages.length > 1 && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <Card className="p-4 bg-ink-surface border border-border-subtle overflow-hidden">
              <h3 className="text-lg font-semibold text-text-primary mb-4 px-2">套餐对比</h3>
              <PackageComparisonTable packages={packages} />
            </Card>
          </div>
        )}

        {/* 加载状态 - 骨架屏 */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PackageCardSkeleton />
            <PackageCardSkeleton />
            <PackageCardSkeleton />
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <Card className="p-6 text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button onClick={loadPackages}>重试</Button>
          </Card>
        )}

        {/* 套餐列表 - 带交错动画 */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className={`
                  transition-all duration-500
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <PackageCard
                  package={pkg}
                  onPurchase={handlePurchase}
                  showSavings={true}
                  averagePrice={50}
                />
              </div>
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
        <div className={`
          transition-all duration-700 ease-out delay-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <Card className="p-6 bg-ink-elevated border border-border-subtle">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              购买须知
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-text-tertiary">•</span>
                <span>套餐购买后不支持退款</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-text-tertiary">•</span>
                <span>套餐在有效期内可随时使用</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-text-tertiary">•</span>
                <span>过期后剩余次数将失效</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-text-tertiary">•</span>
                <span>可在 "我的套餐" 中查看使用记录</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
