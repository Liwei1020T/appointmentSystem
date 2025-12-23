/**
 * 优惠券兑换页面 (Voucher Exchange Page)
 * 
 * 显示可兑换的优惠券列表
 * 用户可使用积分兑换优惠券
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getRedeemableVouchers,
  redeemVoucherWithPoints,
} from '@/services/voucherService';
import { getPointsBalance } from '@/services/pointsService';
import { Voucher } from '@/types';
import { Card, Spinner, Badge, Button, Modal, Toast } from '@/components';

export default function VoucherExchangePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

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

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [vouchersResult, balanceResult] = await Promise.all([
        getRedeemableVouchers(),
        getPointsBalance(),
      ]);

      if (vouchersResult.error) {
        setError(vouchersResult.error);
      } else {
        setVouchers(Array.isArray(vouchersResult.vouchers) ? vouchersResult.vouchers : []);
      }

      if (balanceResult.error) {
        setError(balanceResult.error);
      } else {
        setBalance(balanceResult.balance);
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 点击兑换按钮
  const handleExchangeClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowConfirmModal(true);
  };

  // 确认兑换
  const handleConfirmExchange = async () => {
    if (!selectedVoucher) return;

    setRedeeming(true);

    try {
      const { userVoucher, error } = await redeemVoucherWithPoints(
        selectedVoucher.id
      );

      if (error) {
        setToast({
          show: true,
          message: error || '兑换失败',
          type: 'error',
        });
      } else {
        setToast({
          show: true,
          message: '兑换成功！',
          type: 'success',
        });
        setShowConfirmModal(false);
        // 重新加载数据
        await loadData();
      }
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || '兑换失败',
        type: 'error',
      });
    } finally {
      setRedeeming(false);
    }
  };

  // 获取折扣类型显示文本
  const getDiscountText = (voucher: Voucher): string => {
    if (voucher.discount_type === 'fixed') {
      return `RM ${voucher.discount_value} OFF`;
    } else {
      return `${voucher.discount_value}% OFF`;
    }
  };

  // 检查是否可以兑换
  const canRedeem = (voucher: Voucher): boolean => {
    return balance >= (voucher.points_required ?? 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      {/* 顶部导航 */}
      <div className="glass-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-ink-elevated rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
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
          <h1 className="text-lg font-bold text-text-primary">兑换优惠券</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* 积分余额卡片 */}
        <Card>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary mb-1">当前积分</p>
              <p className="text-3xl font-bold text-accent font-mono">{balance}</p>
            </div>
            <button
              onClick={() => router.push('/points')}
              className="px-4 py-2 text-sm font-medium text-accent hover:bg-ink-elevated rounded-lg transition-colors"
            >
              积分历史
            </button>
          </div>
        </Card>

        {/* 优惠券列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary">可兑换优惠券</h2>

          {vouchers.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-ink-elevated rounded-full flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                  <svg
                    className="w-8 h-8 text-text-tertiary"
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
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  暂无优惠券
                </h3>
                <p className="text-text-secondary">当前没有可兑换的优惠券</p>
              </div>
            </Card>
          ) : (
            (Array.isArray(vouchers) ? vouchers : []).map((voucher: any) => {
              const affordable = canRedeem(voucher);
              const remainingRedemptions = voucher.remaining_redemptions ?? 1;
              const maxPerUser = voucher.max_redemptions_per_user ?? 1;

              return (
                <div
                  key={voucher.id}
                  className={`
                    relative overflow-hidden rounded-xl border transition-all
                    ${affordable
                      ? 'bg-ink-surface border-accent/30 hover:border-accent/50 hover:shadow-lg'
                      : 'bg-ink-elevated border-border-subtle opacity-70'
                    }
                  `}
                >
                  {/* 左侧装饰条 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${affordable ? 'bg-gradient-to-b from-accent to-warning' : 'bg-text-tertiary'}`} />

                  {/* 票券锯齿效果 */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink" />

                  <div className="flex items-stretch">
                    {/* 左侧 - 金额区域 */}
                    <div className={`
                      flex flex-col items-center justify-center px-6 py-5 min-w-[120px] border-r border-dashed
                      ${affordable ? 'border-accent/20' : 'border-border-subtle'}
                    `}>
                      <div className={`text-3xl font-bold font-mono ${affordable ? 'text-accent' : 'text-text-tertiary'}`}>
                        {voucher.discount_type === 'fixed'
                          ? <>RM <span className="text-4xl">{voucher.discount_value}</span></>
                          : <><span className="text-4xl">{voucher.discount_value}</span>%</>
                        }
                      </div>
                      <div className={`text-xs mt-1 ${affordable ? 'text-accent/80' : 'text-text-tertiary'}`}>
                        {voucher.discount_type === 'fixed' ? '立减' : '折扣'}
                      </div>
                    </div>

                    {/* 右侧 - 信息区域 */}
                    <div className="flex-1 p-4 pl-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-base font-semibold ${affordable ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {voucher.name}
                        </h3>
                        {maxPerUser > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-info/15 text-info">
                            可兑{remainingRedemptions}次
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-text-tertiary mb-3">
                        {(voucher.min_purchase ?? 0) > 0 && (
                          <p className="flex items-center gap-1">
                            <span className="text-text-secondary">满</span>
                            <span className="font-mono font-medium text-text-secondary">RM {voucher.min_purchase}</span>
                            <span className="text-text-secondary">可用</span>
                          </p>
                        )}
                        <p className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          有效期至 {new Date(voucher.valid_until).toLocaleDateString('zh-CN')}
                        </p>
                      </div>

                      {/* 积分和兑换按钮 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-accent"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-semibold text-text-primary font-mono">
                            {voucher.points_required ?? 0} 积分
                          </span>
                        </div>

                        <Button
                          variant={affordable ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => handleExchangeClick(voucher)}
                          disabled={!affordable}
                        >
                          {affordable ? '立即兑换' : '积分不足'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 提示信息 */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              兑换说明
            </h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <p>兑换后优惠券将自动添加到 &quot;我的优惠券&quot;</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <p>优惠券有效期从兑换之日起计算</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <p>兑换后积分立即扣除，不可退还</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <p>请注意查看优惠券使用条件</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 兑换确认弹窗 */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="确认兑换"
      >
        {selectedVoucher && (
          <div className="space-y-4">
            <div className="bg-ink-elevated rounded-lg p-4 border border-border-subtle">
              <p className="text-sm text-text-tertiary mb-2">优惠券</p>
              <p className="text-lg font-bold text-text-primary mb-1">
                {selectedVoucher.name}
              </p>
              <Badge variant="info">
                {getDiscountText(selectedVoucher)}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-b border-border-subtle">
              <span className="text-sm text-text-tertiary">所需积分</span>
              <span className="text-lg font-bold text-accent font-mono">
                {selectedVoucher?.points_required ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-tertiary">剩余积分</span>
              <span className="text-lg font-bold text-text-primary font-mono">
                {balance - (selectedVoucher?.points_required ?? 0)}
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirmModal(false)}
                disabled={redeeming}
              >
                取消
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleConfirmExchange}
                loading={redeeming}
                disabled={redeeming}
              >
                {redeeming ? '兑换中...' : '确认兑换'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast 提示 */}
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
