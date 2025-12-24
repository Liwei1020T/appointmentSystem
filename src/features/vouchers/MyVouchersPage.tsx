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
  getUserVouchersForProfile,
  getVoucherStats,
  calculateDiscount,
} from '@/services/voucherService';
import { UserVoucher } from '@/types';
import { Card, Spinner, Badge } from '@/components';
import { formatDate } from '@/lib/utils';
import { Plus, Gift, Calendar, Clock, Tag, ArrowLeft } from 'lucide-react';

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
  const [filter, setFilter] = useState<VoucherFilter>('all');

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

      // 使用 Server Action 获取用户优惠券
      const { vouchers: payload, error: fetchError } = await getUserVouchersForProfile();
      if (fetchError) {
        throw new Error(fetchError);
      }
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
  const getDiscountDisplay = (voucher: UserVoucher) => {
    const v = voucher.voucher;
    if (!v) return { amount: '0', unit: '', type: '' };

    const discountType = v.discount_type || v.type;
    const discountValue = Number(v.discount_value || v.value || 0);

    if (discountType === 'percentage' || discountType === 'percentage_off') {
      return { amount: String(discountValue), unit: '%', type: '折扣' };
    } else {
      return { amount: String(discountValue), unit: '', type: '立减', prefix: 'RM' };
    }
  };

  // 获取优惠券状态
  const getVoucherStatus = (voucher: UserVoucher) => {
    if (voucher.used || voucher.status === 'used') {
      return { text: '已使用', color: 'secondary', bgClass: 'bg-gray-100 text-gray-600' };
    }
    const expiresAt = voucher.expires_at || voucher.expiry;
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return { text: '已过期', color: 'danger', bgClass: 'bg-red-50 text-red-600' };
    }
    return { text: '可用', color: 'success', bgClass: 'bg-accent/10 text-accent' };
  };

  // 判断是否过期
  const isExpired = (voucher: UserVoucher): boolean => {
    const expiresAt = voucher.expires_at || voucher.expiry;
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      {/* 顶部头部 */}
      <div className="bg-ink-surface border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">我的优惠券</h1>
            <p className="text-sm text-text-tertiary mt-1">管理您的优惠券</p>
          </div>
          <button
            onClick={() => router.push('/profile/points')}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            兑换
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-2">可用</p>
              <p className="text-3xl font-bold text-accent font-mono">
                {stats.activeVouchers ?? stats.available ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-2">已用</p>
              <p className="text-3xl font-bold text-gray-600 font-mono">
                {stats.usedVouchers ?? stats.used ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-2">已过期</p>
              <p className="text-3xl font-bold text-gray-400 font-mono">
                {stats.expiredVouchers ?? stats.expired ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* 筛选标签 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${filter === 'all'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${filter === 'available'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            可用
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${filter === 'used'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            已使用
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${filter === 'expired'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            已过期
          </button>
        </div>

        {/* 优惠券列表 */}
        <div className="space-y-4">
          {displayVouchers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无优惠券</h3>
              <p className="text-gray-500 mb-6">
                {filter === 'available'
                  ? '您还没有可用的优惠券'
                  : filter === 'used'
                    ? '您还没有使用过优惠券'
                    : filter === 'expired'
                      ? '没有过期的优惠券'
                      : '您还没有优惠券'}
              </p>
              <button
                onClick={() => router.push('/profile/points')}
                className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
              >
                去兑换优惠券
              </button>
            </div>
          ) : (
            displayVouchers.map((voucher) => {
              const status = getVoucherStatus(voucher);
              const voucherData = voucher.voucher;
              if (!voucherData) return null;

              const discount = getDiscountDisplay(voucher);
              const isActive = status.text === '可用';

              return (
                <div
                  key={voucher.id}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all ${isActive
                    ? 'border-2 border-accent/30 hover:shadow-md'
                    : 'border border-gray-100 opacity-75'
                    }`}
                >
                  <div className="flex">
                    {/* 左侧金额区域 */}
                    <div className={`w-28 flex-shrink-0 flex flex-col items-center justify-center p-4 ${isActive ? 'bg-accent/5' : 'bg-gray-50'
                      }`}>
                      <div className="text-center">
                        {discount.prefix && (
                          <span className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                            {discount.prefix}
                          </span>
                        )}
                        <span className={`text-3xl font-bold font-mono ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                          {' '}{discount.amount}
                        </span>
                        {discount.unit && (
                          <span className={`text-lg font-medium ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                            {discount.unit}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isActive ? 'text-accent/70' : 'text-gray-400'}`}>
                        {discount.type}
                      </p>
                    </div>

                    {/* 右侧信息区域 */}
                    <div className="flex-1 p-4 border-l border-dashed border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-bold text-gray-900">
                          {voucherData.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${status.bgClass}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* 使用条件 */}
                      {(voucherData.min_purchase || voucherData.minPurchase) && (
                        <p className="text-sm text-gray-500 mb-2">
                          满 RM {voucherData.min_purchase || voucherData.minPurchase} 可用
                        </p>
                      )}

                      {/* 有效期信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {(voucher.expires_at || voucher.expiry) && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>有效期至 {formatDate(voucher.expires_at || voucher.expiry)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>获得于 {formatDate(voucher.created_at)}</span>
                        </div>
                      </div>

                      {/* 使用按钮 */}
                      {isActive && (
                        <button
                          onClick={() => router.push('/booking')}
                          className="mt-4 w-full py-2 bg-accent/10 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition-colors"
                        >
                          立即使用
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部提示 */}
        {displayVouchers.length > 0 && filter === 'available' && (
          <p className="text-center text-sm text-gray-400 py-4">
            在下单时可以选择使用优惠券
          </p>
        )}
      </div>
    </div>
  );
}
