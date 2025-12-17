/**
 * 我的优惠券页面 (My Vouchers Page)
 * 
 * 显示用户已拥有的优惠券列表
 * 支持按状态筛选（可用/已使用/已过期）
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getAvailableVouchers,
  getVoucherStats,
  calculateDiscount,
} from '@/services/voucherService';
import { UserVoucher } from '@/types';
import { Card, Spinner, Badge } from '@/components';
import { formatDate } from '@/lib/utils';

type VoucherFilter = 'all' | 'available' | 'used' | 'expired';

export default function MyVouchersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [allVouchers, setAllVouchers] = useState<UserVoucher[]>([]);
  const [displayVouchers, setDisplayVouchers] = useState<UserVoucher[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<VoucherFilter>('available');

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 加载数据
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // 筛选显示
  useEffect(() => {
    filterVouchers();
  }, [filter, allVouchers]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user?.id) return;

      // 使用 API 获取用户优惠券
      const response = await fetch(`/api/user/vouchers`);
      if (!response.ok) {
        throw new Error('获取优惠券失败');
      }
      const vouchersData = await response.json();
      const payload = vouchersData?.data?.vouchers ?? vouchersData?.vouchers ?? [];
      setAllVouchers(Array.isArray(payload) ? payload : []);

      // 获取统计
      const statsResult = await getVoucherStats();
      setStats(statsResult);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const filterVouchers = () => {
    const now = new Date();
    let filtered = allVouchers;

    if (filter === 'available') {
      filtered = allVouchers.filter((v) => {
        const used = v.used ?? v.status === 'used';
        const expiresAt = v.expires_at || v.expiry;
        const notUsed = !used;
        const notExpired = !expiresAt || new Date(expiresAt) > now;
        return notUsed && notExpired;
      });
    } else if (filter === 'used') {
      filtered = allVouchers.filter((v) => v.used ?? v.status === 'used');
    } else if (filter === 'expired') {
      filtered = allVouchers.filter((v) => {
        const used = v.used ?? v.status === 'used';
        const expiresAt = v.expires_at || v.expiry;
        const notUsed = !used;
        const expired = expiresAt && new Date(expiresAt) <= now;
        return notUsed && expired;
      });
    }

    setDisplayVouchers(filtered);
  };

  // 获取折扣显示文本
  const getDiscountText = (voucher: UserVoucher): string => {
    const voucherData = voucher.voucher;
    if (!voucherData) return '';

    if (voucherData.discount_type === 'fixed') {
      return `RM ${voucherData.discount_value} OFF`;
    } else {
      return `${voucherData.discount_value}% OFF`;
    }
  };

  // 检查优惠券是否过期
  const isExpired = (voucher: UserVoucher): boolean => {
    const expiresAt = voucher.expires_at || voucher.expiry;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // 获取优惠券状态
  const getVoucherStatus = (voucher: UserVoucher): {
    text: string;
    color: string;
  } => {
    if (voucher.used) {
      return { text: '已使用', color: 'gray' };
    }
    if (isExpired(voucher)) {
      return { text: '已过期', color: 'red' };
    }
    return { text: '可使用', color: 'green' };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">我的优惠券</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">可用</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeVouchers ?? stats.available ?? 0}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">已用</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.usedVouchers ?? stats.used ?? 0}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600 mb-1">已过期</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.expiredVouchers ?? stats.expired ?? 0}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* 筛选按钮 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'available'
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            可用
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'used'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            已使用
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'expired'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            已过期
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            全部
          </button>
        </div>

        {/* 优惠券列表 */}
        <div className="space-y-3">
          {displayVouchers.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  暂无优惠券
                </h3>
                <p className="text-slate-600 mb-4">
                  {filter === 'available'
                    ? '您还没有可用的优惠券'
                    : filter === 'used'
                    ? '您还没有使用过优惠券'
                    : filter === 'expired'
                    ? '没有过期的优惠券'
                    : '您还没有优惠券'}
                </p>
                <button
                  onClick={() => router.push('/vouchers/exchange')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  去兑换优惠券
                </button>
              </div>
            </Card>
          ) : (
            displayVouchers.map((voucher) => {
              const status = getVoucherStatus(voucher);
              const voucherData = voucher.voucher;
              if (!voucherData) return null;

              return (
                <Card key={voucher.id}>
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 优惠券图标 */}
                      <div
                        className={`w-16 h-16 bg-gradient-to-br rounded-lg flex items-center justify-center flex-shrink-0 ${
                          voucher.used || isExpired(voucher)
                            ? 'from-gray-400 to-gray-500'
                            : 'from-blue-500 to-purple-600'
                        }`}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>

                      {/* 优惠券信息 */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                              {voucherData.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="blue">
                                {getDiscountText(voucher)}
                              </Badge>
                              <Badge variant={status.color as any}>
                                {status.text}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                          {voucherData.description}
                        </p>

                        <div className="space-y-1 text-xs text-slate-500">
                          {voucherData.min_purchase && (
                            <p>• 最低消费: RM {voucherData.min_purchase}</p>
                          )}
                          {voucherData.max_discount && (
                            <p>• 最高优惠: RM {voucherData.max_discount}</p>
                          )}
                          {(voucher.expires_at || voucher.expiry) && (
                            <p>
                              • 有效期至: {formatDate(voucher.expires_at || voucher.expiry)}
                            </p>
                          )}
                          <p>• 获得时间: {formatDate(voucher.created_at)}</p>
                          {voucher.used_at && (
                            <p>• 使用时间: {formatDate(voucher.used_at)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* 底部引导 */}
        {displayVouchers.length > 0 && filter === 'available' && (
          <Card>
            <div className="p-4 text-center">
              <p className="text-sm text-slate-600 mb-3">
                在下单时可以选择使用优惠券
              </p>
              <button
                onClick={() => router.push('/booking')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                立即预约
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
