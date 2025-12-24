/**
 * 积分中心页面 (Points Center Page) - UX Optimized V2
 * 
 * 核心设计理念：
 * 1. 目标感：明确显示距离下一个奖励的进度
 * 2. 获得感：突出可领取的奖励
 * 3. 行动感：提供获取积分的明确路径
 */

'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  History,
  Target,
  ChevronRight,
  Star,
  Zap,
  Info,
  ArrowRight,
  Lock
} from 'lucide-react';
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
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  points_required: number;
  min_purchase: number;
  description?: string;
  owned_count: number;
  max_per_user: number;
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

// ============================================
// Components
// ============================================

const ProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

function VoucherCard({
  voucher,
  currentPoints,
  redeeming,
  onRedeem,
}: {
  voucher: AvailableVoucher;
  currentPoints: number;
  redeeming: string | null;
  onRedeem: (v: AvailableVoucher) => void;
}) {
  const hasEnoughPoints = currentPoints >= voucher.points_required;
  const canRedeem = voucher.can_redeem && hasEnoughPoints;
  const isMaxedOut = !voucher.can_redeem;
  const isRedeeming = redeeming === voucher.id;
  const pointsGap = Math.max(0, voucher.points_required - currentPoints);

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-300 ${canRedeem
        ? 'border-accent/40 hover:border-accent hover:shadow-lg hover:-translate-y-1'
        : 'border-gray-100 hover:border-gray-200'
        }`}
    >
      {/* Top Badge */}
      {voucher.points_required === 0 && canRedeem && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-sm z-10">
          免费领取
        </div>
      )}

      {isMaxedOut && voucher.owned_count > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg">
          <CheckCircle2 className="w-3 h-3" />
          已拥有
        </div>
      )}

      <div className="p-5 flex-1 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full group-hover:scale-110 transition-transform duration-500" />

        <div className="relative z-10">
          {/* Points Cost */}
          <div className="flex items-center gap-1.5 mb-3">
            <Coins className={`w-4 h-4 ${canRedeem ? 'text-accent' : 'text-gray-400'}`} />
            <span className={`text-lg font-bold ${canRedeem ? 'text-accent' : 'text-gray-400'}`}>
              {voucher.points_required}
            </span>
            <span className="text-xs text-gray-400 font-medium">积分</span>
          </div>

          {/* Discount Value */}
          <div className="flex items-baseline gap-1 mb-1">
            {voucher.discount_type === 'fixed' && (
              <span className={`text-sm font-medium ${canRedeem ? 'text-gray-900' : 'text-gray-400'}`}>RM</span>
            )}
            <span className={`text-3xl font-bold tracking-tight ${canRedeem ? 'text-gray-900' : 'text-gray-400'}`}>
              {voucher.discount_value}
            </span>
            {voucher.discount_type === 'percentage' && (
              <span className={`text-lg font-semibold ${canRedeem ? 'text-gray-900' : 'text-gray-400'}`}>% OFF</span>
            )}
          </div>

          <h3 className={`font-medium ${canRedeem ? 'text-gray-700' : 'text-gray-400'}`}>
            {voucher.name || (voucher.discount_type === 'percentage' ? '折扣券' : '代金券')}
          </h3>

          {/* Conditions */}
          <div className="mt-3 space-y-1">
            {voucher.min_purchase > 0 && (
              <p className="text-xs text-gray-400">满 RM {voucher.min_purchase} 可用</p>
            )}
            {voucher.max_per_user > 1 && (
              <p className="text-xs text-gray-400">限领 {voucher.max_per_user} 张</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/50 rounded-b-2xl">
        {!canRedeem && !isMaxedOut ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>进度</span>
              <span>还差 {pointsGap}</span>
            </div>
            <ProgressBar current={currentPoints} target={voucher.points_required} />
            <div className="pt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>积分不足</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onRedeem(voucher)}
            disabled={isMaxedOut || isRedeeming}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isMaxedOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isRedeeming
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : 'bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/30 active:scale-95'
              }`}
          >
            {isRedeeming ? (
              '兑换中...'
            ) : isMaxedOut ? (
              '已达上限'
            ) : (
              <>
                立即兑换
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Layout
// ============================================

function PointsCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const activeTab = tabFromUrl || 'exchange';

  const { data: session, status } = useSession();
  const isAuthenticated = !!session;

  // States
  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<AvailableVoucher[]>([]);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Load Data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, status]);

  // Toast Timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pointsRes, logsRes, vouchersRes, userVouchersRes] = await Promise.all([
        getPointsBalance(),
        getPointsHistory(),
        getRedeemableVouchers(),
        getUserVouchersForProfile()
      ]);

      if (!pointsRes.error) setCurrentPoints(Number(pointsRes.balance) || 0);

      if (!logsRes.error && Array.isArray(logsRes.logs)) {
        setPointsLogs(logsRes.logs.map((log: any) => ({
          id: String(log.id),
          points: Math.abs(Number(log.amount ?? 0)),
          type: Number(log.amount) > 0 ? 'earned' : Number(log.amount) < 0 ? 'spent' : 'expired',
          source: String(log.type || 'bonus'),
          description: String(log.description || log.reason || ''),
          created_at: String(log.createdAt || log.created_at || new Date().toISOString()),
        })));
      }

      if (!vouchersRes.error && Array.isArray(vouchersRes.vouchers)) setAvailableVouchers(vouchersRes.vouchers as unknown as AvailableVoucher[]);
      if (!userVouchersRes.error && Array.isArray(userVouchersRes.vouchers)) setUserVouchers(userVouchersRes.vouchers);

    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleRedeem = async (voucher: AvailableVoucher) => {
    try {
      setRedeeming(voucher.id);
      const result = await redeemVoucherWithPoints(voucher.id);
      if (!result.success) throw new Error(result.error || '兑换失败');

      setToast({ show: true, message: '🎉 兑换成功！', type: 'success' });
      await loadData(); // Refresh all data
    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'error' });
    } finally {
      setRedeeming(null);
    }
  };

  // Smart Sorting & Grouping
  const { redeemableVouchers, goalVouchers, nearestGoal } = useMemo(() => {
    const sorted = [...availableVouchers].sort((a, b) => a.points_required - b.points_required);

    // Redeemable: Can afford AND not maxed out
    const redeemable = sorted.filter(v =>
      v.can_redeem && currentPoints >= v.points_required
    );

    // Goals: Cannot afford OR maxed out (if maxed out, usually push to bottom, but here we treat "aspirational" as goals)
    // Actually better: Goals are things I can't afford yet but can redeem if I had points
    const goals = sorted.filter(v =>
      v.can_redeem && currentPoints < v.points_required
    );

    // Sort goals by closeness
    goals.sort((a, b) => (a.points_required - currentPoints) - (b.points_required - currentPoints));

    return {
      redeemableVouchers: redeemable,
      goalVouchers: goals,
      nearestGoal: goals[0] || null
    };
  }, [availableVouchers, currentPoints]);

  const totalEarned = pointsLogs.filter(l => l.type === 'earned').reduce((sum, l) => sum + l.points, 0);

  if (loading) return <div className="min-h-screen grid place-items-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header with blurred backdrop */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            积分中心
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button
              onClick={() => router.replace('/profile/points?tab=exchange')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'exchange' ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              兑换
            </button>
            <button
              onClick={() => router.replace('/profile/points?tab=my')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'my' ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              我的券
            </button>
            <button
              onClick={() => router.replace('/profile/points?tab=history')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'history' ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              明细
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        {/* ======================= */}
        {/* Hero Section */}
        {/* ======================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm">
          {/* Background patterns - Subtle */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  当前积分
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">{currentPoints}</span>
                  <span className="text-lg font-medium text-gray-400">PTS</span>
                </div>
              </div>

              {/* Goal Tracker */}
              {nearestGoal ? (
                <div className="bg-gradient-to-br from-accent/5 to-white rounded-xl p-4 md:w-80 border border-accent/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">距离 {nearestGoal.name}</span>
                    <span className="text-xs font-bold bg-accent text-white px-2 py-0.5 rounded">还差 {nearestGoal.points_required - currentPoints}</span>
                  </div>
                  <ProgressBar current={currentPoints} target={nearestGoal.points_required} />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-accent/70" />
                    再完成 1 笔订单即可大概率解锁
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-xl p-4 md:w-72 border border-green-100 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">积分自由</p>
                    <p className="text-xs text-gray-500">您已解锁所有奖励！</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'exchange' && (
          <div className="space-y-8">
            {/* 1. Available Now Section */}
            {redeemableVouchers.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <ArrowRight className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">立即兑换</h2>
                  <span className="text-xs text-gray-500 ml-auto">积分充足</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {redeemableVouchers.map(v => (
                    <VoucherCard
                      key={v.id}
                      voucher={v}
                      currentPoints={currentPoints}
                      redeeming={redeeming}
                      onRedeem={handleRedeem}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Goal Section */}
            {goalVouchers.length > 0 && (
              <section className="animate-fade-in-up delay-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-accent/10 rounded-lg">
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">奋斗目标</h2>
                  <span className="text-xs text-gray-500 ml-auto">积攒中...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalVouchers.map(v => (
                    <VoucherCard
                      key={v.id}
                      voucher={v}
                      currentPoints={currentPoints}
                      redeeming={redeeming}
                      onRedeem={handleRedeem}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. Earn Points Section */}
            <section className="mt-8 pt-6 border-t border-gray-200 animate-fade-in-up delay-200">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">如何获得更多积分？</h2>
                <p className="text-xs text-gray-500 mt-1">完成以下任务，快速积累积分</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: ShoppingBag, title: '购买服务', desc: '1 RM = 1 积分', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { icon: Star, title: '评价订单', desc: '+5 积分/单', color: 'text-yellow-500', bg: 'bg-yellow-50' },
                  { icon: UserPlus, title: '邀请好友', desc: '+50 积分/人', color: 'text-purple-500', bg: 'bg-purple-50' },
                  { icon: Calendar, title: '每日签到', desc: '即将上线', color: 'text-gray-400', bg: 'bg-gray-100' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-default">
                    <div className={`p-2.5 rounded-xl mb-2 ${item.bg}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'my' && (
          <div className="animate-fade-in-up">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: 'all', label: '全部' },
                { key: 'available', label: '可用' },
                { key: 'used', label: '已使用' },
                { key: 'expired', label: '已过期' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setVoucherFilter(f.key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${voucherFilter === f.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-1">
              {userVouchers.filter(v => {
                const used = v.used ?? v.status === 'used';
                const expired = (v.expires_at || v.expiry) ? new Date(v.expires_at || v.expiry!).getTime() < Date.now() : false;
                if (voucherFilter === 'available') return !used && !expired;
                if (voucherFilter === 'used') return used;
                if (voucherFilter === 'expired') return expired && !used;
                return true;
              }).map(uv => {
                const isUsed = uv.used ?? uv.status === 'used';
                const isExpired = (uv.expires_at || uv.expiry) ? new Date(uv.expires_at || uv.expiry!).getTime() < Date.now() : false;
                const isValid = !isUsed && !isExpired;

                return (
                  <div key={uv.id} className={`flex items-stretch bg-white rounded-xl overflow-hidden border ${isValid ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                    {/* Left: Value */}
                    <div className={`w-24 flex flex-col items-center justify-center p-3 ${isValid ? 'bg-gradient-to-br from-accent/10 to-transparent' : 'bg-gray-100'}`}>
                      <span className={`text-xl font-bold ${isValid ? 'text-accent' : 'text-gray-400'}`}>
                        {uv.voucher.discount_type === 'fixed' ? `RM${uv.voucher.discount_value}` : `${uv.voucher.discount_value}%`}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1">{uv.voucher.discount_type === 'fixed' ? '立减券' : '折扣券'}</span>
                    </div>
                    {/* Right: Info */}
                    <div className="flex-1 p-3 flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{uv.voucher.name || uv.voucher.code}</h4>
                          {uv.voucher.min_purchase && (
                            <p className="text-[10px] text-gray-500 mt-0.5">满 RM {uv.voucher.min_purchase} 可用</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {(uv.expires_at || uv.expiry) ? formatDate(uv.expires_at || uv.expiry!) + ' 到期' : '永久有效'}
                          </p>
                        </div>
                        {isValid && (
                          <button
                            onClick={() => router.push('/booking')}
                            className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-md hover:bg-black transition-colors"
                          >
                            去使用
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {userVouchers.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Ticket className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">暂无优惠券</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {pointsLogs.length > 0 ? pointsLogs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${log.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {log.type === 'earned' ? <Coins className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-bold font-mono text-sm ${log.type === 'earned' ? 'text-green-600' : 'text-orange-600'}`}>
                    {log.type === 'earned' ? '+' : '-'}{log.points}
                  </span>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400 text-sm">暂无记录</div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PointsCenterPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-50" />}>
      <PointsCenterContent />
    </Suspense>
  )
}
