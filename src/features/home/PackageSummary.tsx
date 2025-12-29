/**
 * 我的权益卡片组件 (My Benefits Card)
 * 
 * 显示用户权益概览：套餐剩余、优惠券、积分
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components';
import SectionLoading from '@/components/loading/SectionLoading';
import { getUserPackageSummary } from '@/services/packageService';
import { getVoucherStats } from '@/services/voucherService';
import { UserPackage } from '@/types';

export default function PackageSummary() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [couponsCount, setCouponsCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [showAllPackages, setShowAllPackages] = useState(false);

  useEffect(() => {
    loadBenefitsData();
  }, []);

  const loadBenefitsData = async () => {
    setLoading(true);

    try {
      // 并行获取所有数据
      const [packageResult, voucherStats] = await Promise.all([
        getUserPackageSummary(),
        getVoucherStats(),
      ]);

      // 套餐数据
      if (packageResult.summary) {
        setTotalRemaining(packageResult.summary.totalRemaining);
        setPackages(packageResult.summary.packages);
      }

      // 优惠券数量
      setCouponsCount(voucherStats.activeVouchers || 0);

      // 积分（从 session 获取）
      if (session?.user) {
        setPoints((session.user as any).points || 0);
      }
    } catch (error) {
      console.error('Error loading benefits data:', error);
    }

    setLoading(false);
  };


  // 计算最近过期的套餐
  const nearestExpiry = packages.length > 0
    ? packages
      .filter(pkg => pkg.expires_at)
      .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0]
    : null;

  if (loading) {
    return (
      <Card>
        <SectionLoading label="加载权益信息..." minHeightClassName="min-h-[180px]" />
      </Card>
    );
  }

  const hasPackages = packages.length > 0;
  const visiblePackages = showAllPackages ? packages : packages.slice(0, 2);
  const hiddenCount = Math.max(packages.length - 2, 0);

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        {/* 标题 */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            我的权益
          </h2>
        </div>


        {/* 三个 Mini Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* 套餐剩余 */}
          <div className="bg-ink-elevated rounded-xl p-4 border border-border-subtle text-center hover:border-accent/30 transition-colors cursor-pointer" onClick={() => router.push('/profile/packages')}>
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-accent font-mono">{totalRemaining}</p>
            <p className="text-xs text-text-tertiary mt-0.5">套餐剩余</p>
            {nearestExpiry && (
              <p className="text-[10px] text-warning mt-1">
                {Math.ceil((new Date(nearestExpiry.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天后到期
              </p>
            )}
          </div>

          {/* 可用优惠券 */}
          <div className="bg-ink-elevated rounded-xl p-4 border border-border-subtle text-center hover:border-success/30 transition-colors cursor-pointer" onClick={() => router.push('/vouchers')}>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-success font-mono">{couponsCount}</p>
            <p className="text-xs text-text-tertiary mt-0.5">可用优惠券</p>
          </div>

          {/* 积分 */}
          <div className="bg-ink-elevated rounded-xl p-4 border border-border-subtle text-center hover:border-info/30 transition-colors cursor-pointer" onClick={() => router.push('/points')}>
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-info font-mono">{points}</p>
            <p className="text-xs text-text-tertiary mt-0.5">积分余额</p>
          </div>
        </div>

        {/* CTA 按钮 */}
        <button
          onClick={() => router.push(hasPackages ? '/booking' : '/packages')}
          className={`
            w-full py-3 px-4 rounded-xl font-medium text-sm 
            flex items-center justify-center gap-2
            transition-all duration-200
            ${hasPackages
              ? 'bg-accent text-text-onAccent hover:bg-accent/90 shadow-lg shadow-accent/20'
              : 'bg-ink-elevated border border-border-subtle text-text-primary hover:border-accent hover:bg-accent/5'
            }
          `}
        >
          {hasPackages ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              使用套餐预约
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              购买套餐享优惠
            </>
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 有套餐时显示快捷标签 */}
        {hasPackages && packages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visiblePackages.map((pkg) => (
              <span
                key={pkg.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-ink-elevated border border-border-subtle text-text-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                {pkg.package?.name || '套餐'}: 剩余 {pkg.remaining} 次
              </span>
            ))}
            {packages.length > 2 && !showAllPackages && (
              <button
                type="button"
                onClick={() => setShowAllPackages(true)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-ink-elevated border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-gray-200 transition-colors"
              >
                +{hiddenCount} 更多
              </button>
            )}
            {packages.length > 2 && showAllPackages && (
              <button
                type="button"
                onClick={() => setShowAllPackages(false)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-ink-elevated border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-gray-200 transition-colors"
              >
                收起
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

