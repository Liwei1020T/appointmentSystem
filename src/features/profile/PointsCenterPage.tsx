/**
 * 积分中心页面 (Points Center Page)
 * 
 * 显示用户积分余额、明细历史和兑换优惠券
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

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
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  points_required: number;
  min_purchase: number;
  description: string;
}

export default function PointsCenterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;

  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointsLogs, setPointsLogs] = useState<PointsLog[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<AvailableVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);

    try {
      // 获取用户当前积分
      const pointsRes = await fetch('/api/points');
      const pointsPayload = await pointsRes.json();
      const pointsData = pointsPayload?.data ?? pointsPayload;
      
      // API returns { balance, logs } (wrapped with { success, data })
      if (pointsRes.ok && pointsData?.balance !== undefined) {
        setCurrentPoints(Number(pointsData.balance) || 0);
      }

      // 获取积分明细
      const logsRes = await fetch('/api/points/history');
      const logsPayload = await logsRes.json();
      const logsData = logsPayload?.data ?? logsPayload;
      
      // API returns { logs } (wrapped)
      if (logsRes.ok && Array.isArray(logsData?.logs)) {
        const mapped: PointsLog[] = logsData.logs.map((log: any) => {
          const amount = Number(log.amount ?? 0);
          return {
            id: String(log.id),
            points: Math.abs(amount),
            type: amount > 0 ? 'earned' : amount < 0 ? 'spent' : 'expired',
            // Use backend `type` as source: 'order' | 'referral' | 'redeem' | 'admin_grant' | ...
            source: String(log.type || 'bonus'),
            description: String(log.description || log.reason || ''),
            created_at: String(log.createdAt || log.created_at || new Date().toISOString()),
          };
        });
        setPointsLogs(mapped);
      }

      // 获取可兑换优惠券
      const vouchersRes = await fetch('/api/vouchers/redeemable');
      const vouchersPayload = await vouchersRes.json();
      const vouchersData = vouchersPayload?.data ?? vouchersPayload;
      
      if (vouchersRes.ok && Array.isArray(vouchersData?.vouchers)) {
        setAvailableVouchers(vouchersData.vouchers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }

    setLoading(false);
  };

  const handleRedeemVoucher = async (voucher: AvailableVoucher) => {
    if (currentPoints < voucher.points_required) {
      setToast({
        show: true,
        message: '积分不足',
        type: 'error',
      });
      return;
    }

    setRedeeming(voucher.id);

    try {
      /**
       * 调用“积分兑换”接口（按 voucherId）
       * 注意：`/api/vouchers/redeem` 需要 `code`，这里是积分中心（按 voucherId 兑换），应使用 redeem-with-points。
       */
      const response = await fetch('/api/vouchers/redeem-with-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId: voucher.id }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Redeem failed');

      setToast({
        show: true,
        message: '兑换成功！',
        type: 'success',
      });

      // 重新加载数据
      loadData();
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '兑换失败',
        type: 'error',
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'order':
        return <ShoppingBag className="w-4 h-4" />;
      case 'referral':
        return <UserPlus className="w-4 h-4" />;
      case 'redeem':
        return <Ticket className="w-4 h-4" />;
      case 'bonus':
      case 'admin_grant':
        return <Gift className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 计算统计数据
  const totalEarned = pointsLogs
    .filter((log) => log.type === 'earned')
    .reduce((sum, log) => sum + log.points, 0);

  const totalSpent = Math.abs(
    pointsLogs
      .filter((log) => log.type === 'spent')
      .reduce((sum, log) => sum + log.points, 0)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">积分中心</h1>
          <p className="text-text-secondary">查看积分余额、明细和兑换优惠</p>
        </div>

        {/* 积分总览 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* 当前积分 */}
          <div className="bg-gradient-to-br from-accent/25 via-ink-surface to-ink-elevated rounded-lg border border-border-subtle p-6 text-text-primary col-span-1 md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-secondary">当前积分</h3>
              <Coins className="w-6 h-6 text-accent" />
            </div>
            <p className="text-5xl font-bold mb-2">{currentPoints}</p>
            <p className="text-text-secondary text-sm">可用于兑换优惠券</p>
          </div>

          {/* 累计获得 */}
          <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">累计获得</h3>
              <div className="p-2 bg-success/15 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{totalEarned}</p>
            <p className="text-sm text-text-secondary">总获得积分</p>
          </div>

          {/* 累计消费 */}
          <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">累计消费</h3>
              <div className="p-2 bg-warning/15 rounded-lg">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{totalSpent}</p>
            <p className="text-sm text-text-secondary">已兑换积分</p>
          </div>
        </div>

        {/* 兑换优惠券 */}
        <div className="bg-ink-surface rounded-lg border border-border-subtle mb-8">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-text-primary">积分兑换</h2>
            </div>
            <p className="text-sm text-text-secondary mt-1">使用积分兑换优惠券</p>
          </div>

          <div className="p-6">
            {availableVouchers.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">暂无可兑换优惠券</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableVouchers.map((voucher) => {
                  const canRedeem = currentPoints >= voucher.points_required;

                  return (
                    <div
                      key={voucher.id}
                      className={`border rounded-lg p-4 ${
                        canRedeem
                          ? 'border-accent-border bg-ink-elevated'
                          : 'border-border-subtle bg-ink-surface/60 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary mb-1">
                            {voucher.discount_type === 'percentage'
                              ? `${voucher.discount_value}% OFF`
                              : `RM ${voucher.discount_value} OFF`}
                          </h3>
                          <p className="text-sm text-text-secondary">{voucher.description}</p>
                          {voucher.min_purchase > 0 && (
                            <p className="text-xs text-text-tertiary mt-1">
                              最低消费: RM {voucher.min_purchase}
                            </p>
                          )}
                        </div>
                        <Ticket className="w-6 h-6 text-accent" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-accent font-semibold">
                          <Coins className="w-4 h-4" />
                          {voucher.points_required} 积分
                        </div>

                        <button
                          onClick={() => handleRedeemVoucher(voucher)}
                          disabled={!canRedeem || redeeming === voucher.id}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            canRedeem
                              ? 'bg-accent text-text-onAccent hover:shadow-glow'
                              : 'bg-ink-elevated text-text-tertiary cursor-not-allowed'
                          } ${redeeming === voucher.id ? 'opacity-50' : ''}`}
                        >
                          {redeeming === voucher.id ? '兑换中...' : '立即兑换'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 积分明细 */}
        <div className="bg-ink-surface rounded-lg border border-border-subtle">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-text-primary">积分明细</h2>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {pointsLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Coins className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">暂无积分记录</p>
              </div>
            ) : (
              pointsLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-ink-elevated transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          log.type === 'earned'
                            ? 'bg-success/15'
                            : log.type === 'spent'
                            ? 'bg-warning/15'
                            : 'bg-ink-elevated'
                        }`}
                      >
                        {getSourceIcon(log.source)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {getSourceLabel(log.source)}
                        </p>
                        <p className="text-sm text-text-secondary">{log.description}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${
                          log.type === 'earned'
                            ? 'text-success'
                            : log.type === 'spent'
                            ? 'text-warning'
                            : 'text-text-secondary'
                        }`}
                      >
                        {log.type === 'earned' ? '+' : ''}
                        {log.points}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Toast 通知 */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                toast.type === 'success'
                  ? 'bg-success text-text-primary'
                  : 'bg-danger text-text-primary'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{toast.message}</p>
              <button
                onClick={() => setToast({ ...toast, show: false })}
                className="ml-2 hover:opacity-80"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
