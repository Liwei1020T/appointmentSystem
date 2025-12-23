/**
 * 我的套餐页组件 (My Packages Page)
 * 
 * 展示用户已购买的套餐，包括剩余次数、有效期、使用记录
 * 同时显示待审核的套餐购买
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserPackages, UserPackageWithPackage } from '@/services/packageService';
import { getPendingPackagePaymentsAction } from '@/actions/packages.actions';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { formatDate, calculateDaysRemaining } from '@/lib/utils';
import { useSession } from 'next-auth/react';

// 待审核套餐类型
interface PendingPackagePayment {
  id: string;
  packageId: string;
  packageName: string;
  packageTimes: number;
  packageValidityDays: number;
  amount: number;
  status: string;
  provider: string;
  receiptUrl: string | null;
  createdAt: string;
}

export default function MyPackagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [packages, setPackages] = useState<UserPackageWithPackage[]>([]);
  const [pendingPackages, setPendingPackages] = useState<PendingPackagePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showExpired, setShowExpired] = useState<boolean>(false);

  // 加载套餐列表
  const loadPackages = async () => {
    setLoading(true);
    setError('');

    try {
      // 获取已激活套餐
      const { data, error: err } = await getUserPackages(false);
      if (err) {
        setError(err.message || '加载套餐失败');
        setPackages([]);
      } else {
        setPackages(data || []);
      }

      // 获取待审核套餐
      const pending = await getPendingPackagePaymentsAction();
      setPendingPackages(pending);
    } catch (err: any) {
      setError(err.message || '加载套餐失败');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile/packages');
      return;
    }

    loadPackages();
  }, [user]);


  /**
   * 获取套餐过期时间（兼容历史字段命名）。
   *
   * Prisma 迁移后字段为 `expiry`（DateTime），旧代码/旧接口可能使用 `expires_at/expiry_date` 等字段。
   */
  const getExpiryValue = (pkg: UserPackageWithPackage): string | Date | null => {
    return (
      (pkg as any).expiry ??
      (pkg as any).expiry_date ??
      (pkg as any).expires_at ??
      (pkg as any).expiresAt ??
      null
    );
  };

  // 检查套餐是否有效
  const isPackageValid = (pkg: UserPackageWithPackage): boolean => {
    if (pkg.remaining <= 0) return false;
    const expiry = getExpiryValue(pkg);
    if (!expiry) return true;
    return new Date(expiry).getTime() > Date.now();
  };

  // 过滤套餐
  const validPackages = packages.filter(isPackageValid);
  const expiredPackages = packages.filter((pkg) => !isPackageValid(pkg));

  const displayPackages = showExpired ? expiredPackages : validPackages;

  return (
    <div className="min-h-screen bg-ink">
      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">我的套餐</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 统计卡片 */}
        {!loading && !error && validPackages.length > 0 && (
          <Card className="p-6 bg-ink-elevated text-text-primary border border-border-subtle">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-tertiary text-sm mb-1">剩余总次数</p>
                <p className="text-3xl font-bold font-mono text-accent">
                  {validPackages.reduce((sum, pkg) => sum + pkg.remaining, 0)}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-sm mb-1">有效套餐</p>
                <p className="text-3xl font-bold font-mono">{validPackages.length}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 切换按钮 */}
        {!loading && !error && (validPackages.length > 0 || expiredPackages.length > 0) && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowExpired(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showExpired
                ? 'bg-accent text-text-onAccent'
                : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                }`}
            >
              有效套餐 ({validPackages.length})
            </button>
            <button
              onClick={() => setShowExpired(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showExpired
                ? 'bg-accent text-text-onAccent'
                : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                }`}
            >
              已过期 ({expiredPackages.length})
            </button>
          </div>
        )}

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

        {/* 待审核套餐 */}
        {!loading && pendingPackages.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
              待审核套餐 ({pendingPackages.length})
            </h2>
            {pendingPackages.map((payment) => (
              <Card key={payment.id} className="p-5 border-2 border-info/30 bg-info/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      {payment.packageName}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info/20 text-info border border-info/30">
                        ⏳ 审核中
                      </span>
                    </h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      购买于 {new Date(payment.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-text-tertiary">穿线次数</p>
                    <p className="font-semibold text-text-primary">{payment.packageTimes} 次</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">有效期</p>
                    <p className="font-semibold text-text-primary">{payment.packageValidityDays} 天</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">支付金额</p>
                    <p className="font-semibold text-accent font-mono">RM {payment.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
                  <p className="text-sm text-info flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {payment.status === 'pending' && payment.provider === 'cash'
                      ? '等待管理员确认收款'
                      : payment.status === 'pending'
                        ? '请上传支付收据'
                        : '正在等待管理员审核收据'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}


        {/* 套餐列表 */}
        {!loading && !error && displayPackages.length > 0 && (
          <div className="space-y-3">
            {displayPackages.map((pkg) => {
              const isValid = isPackageValid(pkg);
              const expiry = getExpiryValue(pkg);
              const daysRemaining = expiry ? calculateDaysRemaining(expiry) : null;
              const packageInfo = pkg.package;
              const packageTimes = packageInfo?.times ?? 0;
              const usedTimes = Math.max(packageTimes - pkg.remaining, 0);
              const usagePercentage = packageTimes > 0 ? (usedTimes / packageTimes) * 100 : 0;

              return (
                <Card
                  key={pkg.id}
                  className={`p-6 ${!isValid ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {packageInfo?.name || '套餐'}
                      </h3>
                      <p className="text-sm text-text-tertiary mt-1">
                        购买于 {pkg.created_at || pkg.createdAt ? formatDate(pkg.created_at || pkg.createdAt!) : '未知'}
                      </p>
                    </div>
                    {!isValid && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-ink-elevated text-text-tertiary border border-border-subtle">
                        已过期
                      </span>
                    )}
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-text-tertiary">使用进度</span>
                      <span className="text-sm font-medium text-text-primary">
                        {usedTimes} / {packageTimes} 次
                      </span>
                    </div>
                    <div className="w-full bg-ink-elevated rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${usagePercentage === 100
                          ? 'bg-ink-surface'
                          : 'bg-accent'
                          }`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-tertiary">剩余次数</p>
                      <p className="font-semibold text-text-primary text-lg font-mono">
                        {pkg.remaining} 次
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary">有效期</p>
                      {expiry ? (
                        <div>
                          <p className="font-semibold text-text-primary">
                            {daysRemaining !== null && daysRemaining > 0
                              ? `剩余 ${daysRemaining} 天`
                              : '已过期'}
                          </p>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {new Date(expiry).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold text-success">永久有效</p>
                      )}
                    </div>
                  </div>

                  {/* 提醒 */}
                  {isValid && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
                    <div className="mt-4 p-3 bg-warning/10 rounded-lg flex items-start gap-2 border border-warning/30">
                      <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-warning">
                        套餐即将过期，请尽快使用
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && displayPackages.length === 0 && (
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
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {showExpired ? '无已过期套餐' : '暂无有效套餐'}
            </h3>
            <p className="text-text-secondary mb-6">
              {showExpired ? '您目前没有已过期的套餐' : '购买套餐享受更多优惠'}
            </p>
            {!showExpired && (
              <Button onClick={() => router.push('/packages')}>购买套餐</Button>
            )}
          </Card>
        )}

        {/* 提示卡片 */}
        {!loading && !error && validPackages.length > 0 && !showExpired && (
          <Card className="p-6 bg-ink-elevated border border-border-subtle">
            <h3 className="font-semibold text-text-primary mb-3">使用说明</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• 预约时可选择使用套餐抵扣</li>
              <li>• 优先使用即将过期的套餐</li>
              <li>• 过期后剩余次数将失效</li>
              <li>• 套餐不可转让或退款</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
