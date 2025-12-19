/**
 * 优惠券兑换页面组件 (Voucher Redemption Page Component)
 * 
 * 功能：
 * - 显示用户当前积分余额
 * - 展示可兑换的优惠券列表
 * - 显示每个优惠券的积分成本
 * - 提供兑换按钮（积分不足时禁用）
 * - 兑换确认弹窗
 * - 成功/失败反馈
 */

'use client';

import { useEffect, useState } from 'react';
import { getPointsBalance } from '@/services/pointsService';
import { getRedeemableVouchers, redeemVoucherWithPoints } from '@/services/voucherService';
import type { Voucher } from '@/types';

export default function VoucherRedemptionPage() {
  const [balance, setBalance] = useState<number>(0);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // 获取积分余额
    const { balance: currentBalance, error: balanceError } = await getPointsBalance();
    if (balanceError) {
      setError(balanceError);
      setLoading(false);
      return;
    }

    setBalance(currentBalance || 0);

    // 获取可兑换优惠券
    const { vouchers: availableVouchers, error: vouchersError } = await getRedeemableVouchers();
    if (vouchersError) {
      setError(String(vouchersError));
    } else {
      setVouchers(availableVouchers || []);
    }

    setLoading(false);
  };

  const handleRedeemClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowConfirmModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedVoucher) return;

    setRedeeming(true);
    const { userVoucher, error } = await redeemVoucherWithPoints(selectedVoucher.id);

    if (error) {
      setToast({ message: error, type: 'error' });
    } else {
      setToast({ message: '兑换成功！', type: 'success' });
      // 重新加载数据
      await loadData();
    }

    setRedeeming(false);
    setShowConfirmModal(false);
    setSelectedVoucher(null);

    // 3秒后自动关闭提示
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to convert Prisma Decimal to number
  const toNum = (val: number | { toNumber(): number } | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && 'toNumber' in val) return val.toNumber();
    return Number(val);
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    const discountType = voucher.discount_type || (voucher.type === 'fixed_amount' ? 'fixed' : 'percentage');
    const discountValue = toNum(voucher.discount_value ?? voucher.value);

    if (discountType === 'fixed') {
      return `RM ${discountValue.toFixed(2)}`;
    }

    return `${discountValue}%`;
  };

  const canAfford = (voucher: Voucher) => {
    const pointsCost = voucher.points_cost ?? voucher.pointsCost ?? 0;
    const requiredPoints = voucher.points_required ?? pointsCost;
    return balance >= requiredPoints;
  };

  return (
    <div className="min-h-screen bg-ink pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 glass-surface border-b border-border-subtle">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-text-primary">兑换优惠券</h1>
        </div>
      </div>

      {/* 积分余额横幅 */}
      <div className="bg-ink-elevated p-6 text-text-primary border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-tertiary mb-1">我的积分</div>
            <div className="text-3xl font-bold font-mono text-accent">{balance}</div>
          </div>
          <div className="text-5xl">💰</div>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
            <p className="text-text-tertiary mt-2">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-center">
            <p className="text-danger">{error}</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="bg-ink-surface rounded-lg p-12 text-center border border-border-subtle">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-text-secondary mb-2">暂无可兑换优惠券</p>
            <p className="text-sm text-text-tertiary">敬请期待更多优惠</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vouchers.map((voucher) => {
              const affordable = canAfford(voucher);
              return (
                <div
                  key={voucher.id}
                  className={`bg-ink-surface rounded-xl p-4 shadow-sm border-2 transition-all ${
                    affordable ? 'border-accent-border' : 'border-border-subtle opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 折扣标签 */}
                    <div className="bg-ink-elevated rounded-xl p-4 text-text-primary min-w-[80px] text-center border border-border-subtle">
                      <div className="text-xs text-text-tertiary mb-1">立减</div>
                      <div className="text-xl font-bold text-accent">{getDiscountDisplay(voucher)}</div>
                    </div>

                    {/* 优惠券详情 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary mb-1">{voucher.name}</h3>
                      {voucher.description && (
                        <p className="text-sm text-text-secondary mb-2">{voucher.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-text-tertiary mb-3">
                        {(voucher.min_purchase || voucher.minPurchase) && (
                          <span className="bg-ink-elevated px-2 py-1 rounded border border-border-subtle">
                            满 RM {toNum(voucher.min_purchase ?? voucher.minPurchase)}
                          </span>
                        )}
                        {voucher.max_discount && voucher.discount_type === 'percentage' && (
                          <span className="bg-ink-elevated px-2 py-1 rounded border border-border-subtle">
                            最高减 RM {toNum(voucher.max_discount)}
                          </span>
                        )}
                        {voucher.validity_days && (
                          <span className="bg-ink-elevated px-2 py-1 rounded border border-border-subtle">
                            有效期 {voucher.validity_days} 天
                          </span>
                        )}
                      </div>

                      {/* 积分成本 + 兑换按钮 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-accent font-semibold">
                          <span className="text-lg font-mono">{voucher.points_required}</span>
                          <span className="text-sm">积分</span>
                        </div>
                        <button
                          onClick={() => handleRedeemClick(voucher)}
                          disabled={!affordable}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            affordable
                              ? 'bg-accent text-text-onAccent hover:shadow-glow'
                              : 'bg-ink-elevated text-text-tertiary cursor-not-allowed'
                          }`}
                        >
                          {affordable ? '立即兑换' : '积分不足'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 确认兑换弹窗 */}
      {showConfirmModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎁</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">确认兑换？</h3>
              <p className="text-sm text-text-secondary mb-4">{selectedVoucher.name}</p>
              <div className="bg-ink-elevated rounded-lg p-3 border border-border-subtle">
                <div className="text-sm text-text-tertiary mb-1">消耗积分</div>
                <div className="text-2xl font-bold text-accent font-mono">
                  {selectedVoucher.points_required}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={redeeming}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-secondary bg-ink-elevated hover:bg-ink-surface transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={redeeming}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-text-onAccent bg-accent hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {redeeming ? '兑换中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-text-primary font-medium ${
              toast.type === 'success' ? 'bg-success' : 'bg-danger'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
