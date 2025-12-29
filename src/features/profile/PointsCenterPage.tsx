/**
 * 积分中心页面 (Points Center Page)
 * 
 * 统一的积分与优惠券管理中心
 * 包含三个Tab：积分兑换、我的优惠券、积分明细
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingBag,
  UserPlus,
  Calendar,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  Tag,
  History,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageLoading from '@/components/loading/PageLoading';
import { getPointsBalance, getPointsHistory } from '@/services/pointsService';
import { getRedeemableVouchers, redeemVoucherWithPoints, getUserVouchersForProfile, getVoucherStats } from '@/services/voucherService';
import { formatDate } from '@/lib/utils';

// Types
interface PointsLog {
  id: string;
  points: number;
  type: 'earned' | 'spent' | 'expired';
  source: string;
  description: string;
  created_at: string;
}

interface AvailableVoucher {
  id: string;
  code: string;
  name?: string;
  type?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  value?: number;
  points_required?: number;
  pointsCost?: number;
  min_purchase?: number;
  minPurchase?: number;
  description?: string;
  owned_count: number;
  max_per_user: number;
  maxRedemptionsPerUser?: number;
  can_redeem: boolean;
  remaining_redemptions: number;
}

interface UserVoucher {
  id: string;
  voucher: {
    id: string;
    code: string;
    name?: string;
    discount_type?: string;
    discount_value?: number;
    min_purchase?: number;
  };
  status: string;
  used?: boolean;
  expires_at?: string;
  expiry?: string;
  created_at?: string;
  used_at?: string;
}

type TabType = 'exchange' | 'my' | 'history';

function PointsCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const activeTab = tabFromUrl || 'exchange';

  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  // States
  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<AvailableVoucher[]>([]);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [voucherStats, setVoucherStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !loading) {
      const timer = setTimeout(() => setIsVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, loading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, authLoading]);

  // Auto-hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const setTab = (tab: TabType) => {
    router.replace(`/profile/points?tab=${tab}`, { scroll: false });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取积分余额
      const pointsResult = await getPointsBalance();
      if (!pointsResult.error) {
        setCurrentPoints(Number(pointsResult.balance) || 0);
      }

      // 获取积分明细
      const logsResult = await getPointsHistory();
      if (!logsResult.error && Array.isArray(logsResult.logs)) {
        const mapped: PointsLog[] = logsResult.logs.map((log: any) => {
          const amount = Number(log.amount ?? 0);
          return {
            id: String(log.id),
            points: Math.abs(amount),
            type: amount > 0 ? 'earned' : amount < 0 ? 'spent' : 'expired',
            source: String(log.type || 'bonus'),
            description: String(log.description || log.reason || ''),
            created_at: String(log.createdAt || log.created_at || new Date().toISOString()),
          };
        });
        setPointsLogs(mapped);
      }

      // 获取可兑换优惠券
      const vouchersResult = await getRedeemableVouchers();
      if (!vouchersResult.error && Array.isArray(vouchersResult.vouchers)) {
        setAvailableVouchers(vouchersResult.vouchers as any);
      }

      // 获取用户已有优惠券
      const userVouchersResult = await getUserVouchersForProfile();
      if (!userVouchersResult.error && Array.isArray(userVouchersResult.vouchers)) {
        setUserVouchers(userVouchersResult.vouchers as any);
      }

      // 获取优惠券统计
      const statsResult = await getVoucherStats();
      setVoucherStats(statsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleRedeemVoucher = async (voucher: AvailableVoucher) => {
    const pointsRequired = voucher.points_required || voucher.pointsCost || 0;
    if (currentPoints < pointsRequired || !voucher.can_redeem) {
      return;
    }

    setRedeeming(voucher.id);
    try {
      const result = await redeemVoucherWithPoints(voucher.id);
      if (!result.success) throw new Error(result.error || 'Redeem failed');

      setToast({ show: true, message: '兑换成功！', type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ show: true, message: err.message || '兑换失败', type: 'error' });
    } finally {
      setRedeeming(null);
    }
  };

  // Helper functions
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'order': return <ShoppingBag className="w-4 h-4" />;
      case 'referral': return <UserPlus className="w-4 h-4" />;
      case 'redeem': return <Ticket className="w-4 h-4" />;
      case 'bonus':
      case 'admin_grant': return <Gift className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      order: '订单完成',
      referral: '邀请好友',
      redeem: '兑换优惠券',
      bonus: '奖励',
      admin_grant: '管理员调整',
    };
    return labels[source] || source;
  };

  const formatDateStr = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter user vouchers
  const getFilteredVouchers = () => {
    const now = new Date();
    return userVouchers.filter((v) => {
      const used = v.used ?? v.status === 'used';
      const expiresAt = v.expires_at || v.expiry;
      const isExpired = expiresAt && new Date(expiresAt) <= now;

      if (voucherFilter === 'available') return !used && !isExpired;
      if (voucherFilter === 'used') return used;
      if (voucherFilter === 'expired') return !used && isExpired;
      return true;
    });
  };

  // Statistics
  const totalEarned = pointsLogs.filter((log) => log.type === 'earned').reduce((sum, log) => sum + log.points, 0);
  const totalSpent = Math.abs(pointsLogs.filter((log) => log.type === 'spent').reduce((sum, log) => sum + log.points, 0));

  if (authLoading || loading) {
    return <PageLoading />;
  }

  const tabs = [
    { key: 'exchange' as TabType, label: '积分兑换', icon: Sparkles },
    { key: 'my' as TabType, label: '我的优惠券', icon: Ticket },
    { key: 'history' as TabType, label: '积分明细', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader
        title="积分中心"
        subtitle="查看积分余额、明细和兑换优惠"
      />

      <div className={`
        max-w-2xl mx-auto px-4 py-6 space-y-6
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl border border-accent/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">当前积分</span>
              <Coins className="w-5 h-5 text-accent" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{currentPoints}</p>
            <p className="text-xs text-gray-500 mt-1">可用于兑换优惠券</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">累计获得</span>
              <div className="p-1.5 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalEarned}</p>
            <p className="text-xs text-gray-400 mt-1">总获得积分</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">累计消费</span>
              <div className="p-1.5 bg-orange-50 rounded-lg">
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalSpent}</p>
            <p className="text-xs text-gray-400 mt-1">已兑换积分</p>
          </div>
        </div>

        {/* Tab Navigation - 分段式设计 */}
        <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Tab: 积分兑换 */}
          {activeTab === 'exchange' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-gray-900">使用积分兑换优惠券</h2>
              </div>

              {availableVouchers.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无可兑换优惠券</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {availableVouchers.map((voucher) => {
                    const pointsRequired = voucher.points_required || voucher.pointsCost || 0;
                    const hasEnoughPoints = currentPoints >= pointsRequired;
                    const canRedeem = voucher.can_redeem && hasEnoughPoints;
                    const isMaxedOut = !voucher.can_redeem;

                    return (
                      <div
                        key={voucher.id}
                        className={`relative border rounded-xl p-5 transition-all ${canRedeem
                          ? 'border-accent/40 bg-gradient-to-br from-accent/5 to-white hover:shadow-lg'
                          : isMaxedOut
                            ? 'border-gray-200 bg-gray-50 opacity-60'
                            : 'border-gray-200 bg-gray-50 opacity-80'
                          }`}
                      >
                        {voucher.owned_count > 0 && (
                          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent text-white text-xs font-bold rounded-full shadow-sm">
                            已有 {voucher.owned_count} 张
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {voucher.discount_type === 'percentage' || voucher.type === 'percentage'
                                ? `${voucher.discount_value || voucher.value}% OFF`
                                : `RM ${voucher.discount_value || voucher.value} OFF`}
                            </h3>
                            {voucher.name && (
                              <p className="text-sm text-gray-600 font-medium">{voucher.name}</p>
                            )}
                            {(voucher.min_purchase || (voucher as any).minPurchase > 0) && (
                              <p className="text-xs text-gray-400 mt-1">满 RM {voucher.min_purchase || (voucher as any).minPurchase} 可用</p>
                            )}
                          </div>
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Ticket className="w-6 h-6 text-accent" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 text-xs">
                          {voucher.max_per_user > 1 && (
                            <span className={`px-2 py-0.5 rounded-full ${voucher.can_redeem ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                              }`}>
                              {voucher.can_redeem
                                ? `还可兑换 ${voucher.remaining_redemptions} 张`
                                : `已达上限 ${voucher.max_per_user} 张`}
                            </span>
                          )}
                          {voucher.max_per_user === 1 && voucher.owned_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600">已兑换</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-accent font-bold">
                            <Coins className="w-4 h-4" />
                            <span>{voucher.points_required || voucher.pointsCost} 积分</span>
                          </div>

                          <div className="text-right">
                            {!hasEnoughPoints && !isMaxedOut && (
                              <p className="text-xs text-warning font-medium mb-1">
                                还差 {(voucher.points_required || (voucher as any).pointsCost) - currentPoints} 积分
                              </p>
                            )}
                            <button
                              onClick={() => handleRedeemVoucher(voucher)}
                              disabled={!canRedeem || redeeming === voucher.id}
                              className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${canRedeem
                                ? 'bg-accent text-white hover:shadow-glow hover:scale-105'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                } ${redeeming === voucher.id ? 'opacity-50' : ''}`}
                            >
                              {redeeming === voucher.id
                                ? '兑换中...'
                                : isMaxedOut
                                  ? '已达上限'
                                  : !hasEnoughPoints
                                    ? '积分不足'
                                    : '立即兑换'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: 我的优惠券 */}
          {activeTab === 'my' && (
            <div>
              {/* Filter buttons */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'available', label: '可用' },
                  { key: 'used', label: '已使用' },
                  { key: 'expired', label: '已过期' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setVoucherFilter(f.key as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${voucherFilter === f.key
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Voucher list */}
              {getFilteredVouchers().length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">暂无优惠券</p>
                  <button
                    onClick={() => setTab('exchange')}
                    className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:shadow-glow"
                  >
                    去兑换优惠券
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredVouchers().map((voucher) => {
                    const v = voucher.voucher;
                    if (!v) return null;
                    const used = voucher.used ?? voucher.status === 'used';
                    const expiresAt = voucher.expires_at || voucher.expiry;
                    const isExpired = expiresAt && new Date(expiresAt) <= new Date();
                    const isActive = !used && !isExpired;
                    const discountType = v.discount_type || 'fixed';
                    const discountValue = v.discount_value || 0;

                    return (
                      <div
                        key={voucher.id}
                        className={`flex rounded-xl overflow-hidden border transition-all ${isActive
                          ? 'border-accent/30 bg-white hover:shadow-md'
                          : 'border-gray-200 bg-gray-50 opacity-70'
                          }`}
                      >
                        {/* Left: Amount */}
                        <div className={`w-28 flex-shrink-0 flex flex-col items-center justify-center p-4 ${isActive ? 'bg-accent/5' : 'bg-gray-100'
                          }`}>
                          <div className="text-center">
                            {discountType === 'fixed' && (
                              <span className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-gray-400'}`}>RM</span>
                            )}
                            <span className={`text-3xl font-bold font-mono ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                              {' '}{discountValue}
                            </span>
                            {discountType === 'percentage' && (
                              <span className={`text-lg font-medium ${isActive ? 'text-accent' : 'text-gray-400'}`}>%</span>
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${isActive ? 'text-accent/70' : 'text-gray-400'}`}>
                            {discountType === 'percentage' ? '折扣' : '立减'}
                          </p>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 p-4 border-l border-dashed border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-base font-bold text-gray-900">{v.name || v.code}</h3>
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${used ? 'bg-gray-100 text-gray-500' : isExpired ? 'bg-red-50 text-red-600' : 'bg-accent/10 text-accent'
                              }`}>
                              {used ? '已使用' : isExpired ? '已过期' : '可用'}
                            </span>
                          </div>

                          {v.min_purchase && v.min_purchase > 0 && (
                            <p className="text-sm text-gray-500 mb-2">满 RM {v.min_purchase} 可用</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {expiresAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>有效期至 {formatDate(expiresAt)}</span>
                              </div>
                            )}
                          </div>

                          {isActive && (
                            <button
                              onClick={() => router.push('/booking')}
                              className="mt-3 w-full py-2 bg-accent/10 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition-colors"
                            >
                              立即使用
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: 积分明细 */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-gray-900">积分明细</h2>
              </div>

              {pointsLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无积分记录</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2">
                  {pointsLogs.map((log) => (
                    <div key={log.id} className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${log.type === 'earned' ? 'bg-green-50' : log.type === 'spent' ? 'bg-orange-50' : 'bg-gray-100'
                          }`}>
                          {getSourceIcon(log.source)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getSourceLabel(log.source)}</p>
                          <p className="text-sm text-gray-500">{log.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateStr(log.created_at)}</p>
                        </div>
                      </div>
                      <p className={`text-xl font-bold ${log.type === 'earned' ? 'text-green-600' : log.type === 'spent' ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                        {log.type === 'earned' ? '+' : '-'}{log.points}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{toast.message}</p>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PointsCenterPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PointsCenterContent />
    </Suspense>
  );
}
