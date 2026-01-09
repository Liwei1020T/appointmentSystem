/**
 * 优惠券选择组件 (Voucher Selector) - 深度优化版
 * 
 * 功能：
 * - 可用/不可用分组展示 (Tabs)
 * - 动态不可用原因 (还差 RM XX 可用)
 * - 列表固定高度滚动 + 自定义滚动条
 * - 底部 Sticky 确认栏
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Modal, Button, Tabs } from '@/components';
import InlineLoading from '@/components/loading/InlineLoading';
import {
  getUserVouchers,
  calculateDiscount,
  validateVoucherForOrder,
  UserVoucherWithVoucher
} from '@/services/voucherService';
import { UserVoucher } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface VoucherSelectorProps {
  orderAmount: number;
  selectedVoucher: UserVoucher | null;
  onSelect: (voucher: UserVoucher | null) => void;
}

export default function VoucherSelector({ orderAmount, selectedVoucher, onSelect }: VoucherSelectorProps) {
  const [vouchers, setVouchers] = useState<UserVoucherWithVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  // 临时选中状态，仅在点击确认时生效
  const [tempSelectedVoucher, setTempSelectedVoucher] = useState<UserVoucher | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  // 当弹窗打开时，同步当前的选中券到临时状态
  useEffect(() => {
    if (showModal) {
      setTempSelectedVoucher(selectedVoucher);
    }
  }, [showModal, selectedVoucher]);

  const loadVouchers = async () => {
    setLoading(true);
    const { vouchers: data } = await getUserVouchers('active');
    if (data) {
      setVouchers(data);
    }
    setLoading(false);
  };

  // 优惠券分组逻辑
  const groupedVouchers = useMemo(() => {
    const available: any[] = [];
    const unavailable: any[] = [];

    vouchers.forEach(v => {
      const { valid, error } = validateVoucherForOrder(v, orderAmount);
      const voucherData = v.voucher;
      const minPurchase = Number(voucherData?.minPurchase || 0);
      const lackAmount = Math.max(0, minPurchase - orderAmount);

      const item = {
        ...v,
        valid,
        error,
        lackAmount,
        discountAmount: calculateDiscount(v, orderAmount)
      };

      if (valid) {
        available.push(item);
      } else {
        unavailable.push(item);
      }
    });

    // 可用优惠券按折扣力度排序（最划算的在前）
    available.sort((a, b) => b.discountAmount - a.discountAmount);

    return { available, unavailable };
  }, [vouchers, orderAmount]);

  // 处理确认应用
  const handleConfirm = () => {
    onSelect(tempSelectedVoucher);
    setShowModal(false);
    if (tempSelectedVoucher) {
      toast.success(`已应用优惠券：${tempSelectedVoucher.voucher?.name}`);
    } else if (selectedVoucher) {
      toast.info('已取消使用优惠券');
    }
  };

  const discount = selectedVoucher ? calculateDiscount(selectedVoucher, orderAmount) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-ink-elevated/30 rounded-2xl border border-dashed border-border-subtle">
        <InlineLoading label="正在寻找优惠券..." />
      </div>
    );
  }

  const tabs = [
    { id: 'available', label: `可用 (${groupedVouchers.available.length})` },
    { id: 'unavailable', label: `不可用 (${groupedVouchers.unavailable.length})` },
  ];

  return (
    <>
      {/* 触发器卡片 */}
      <Card
        variant="elevated"
        onClick={() => setShowModal(true)}
        className="group cursor-pointer active:scale-98 transition-all duration-300 overflow-hidden relative border-border-subtle hover:shadow-md"
      >
        {selectedVoucher && (
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
        )}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300
              ${selectedVoucher ? 'bg-accent/10 border-accent/20' : 'bg-ink-surface/50 border-border-subtle group-hover:bg-accent/5 group-hover:border-accent/20'}
            `}>
              <svg className={`w-6 h-6 ${selectedVoucher ? 'text-accent' : 'text-text-tertiary transition-colors group-hover:text-accent'}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-text-primary">
                {selectedVoucher ? selectedVoucher.voucher?.name : '使用优惠券'}
              </p>
              <p className="text-xs text-text-tertiary mt-1 font-medium">
                {selectedVoucher
                  ? `已享 RM ${discount.toFixed(2)} 优惠`
                  : `${groupedVouchers.available.length} 张可用优惠券`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVoucher ? (
              <span className="text-accent font-black tracking-tighter">-RM {discount.toFixed(2)}</span>
            ) : (
              <span className="text-xs font-bold text-text-tertiary group-hover:text-accent transition-colors">去选择</span>
            )}
            <svg className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 transition-transform" fill="none" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </Card>

      {/* 优惠券选择弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="选择优惠券"
        size="md"
      >
        <div className="flex flex-col h-[70vh] -mx-6 -mb-6 -mt-4 relative bg-white">
          {/* Tabs Header - Solid White */}
          <div className="px-6 border-b border-border-subtle bg-white sticky top-0 z-10 transition-colors">
            <div className="flex items-center justify-between">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="border-none"
              />
              <button
                onClick={() => setTempSelectedVoucher(null)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${!tempSelectedVoucher
                  ? 'text-accent bg-accent/10'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-ink'
                  }`}
              >
                暂不使用
              </button>
            </div>
          </div>

          {/* List Area - Solid White and Custom Minimal Scrollbar */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 custom-voucher-minimal-scroll bg-white">
            <style jsx global>{`
              .custom-voucher-minimal-scroll::-webkit-scrollbar {
                width: 3px;
              }
              .custom-voucher-minimal-scroll::-webkit-scrollbar-track {
                background: transparent;
                margin: 4px;
              }
              .custom-voucher-minimal-scroll::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.08);
                border-radius: 10px;
                transition: background 0.3s;
              }
              .custom-voucher-minimal-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(249, 115, 22, 0.4);
              }
              /* For Firefox */
              .custom-voucher-minimal-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
              }
            `}</style>

            {(activeTab === 'available' ? groupedVouchers.available : groupedVouchers.unavailable).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-ink-elevated/40 rounded-full flex items-center justify-center mb-4 border border-border-subtle/50">
                  <svg className="w-8 h-8 text-text-tertiary opacity-40" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <p className="text-text-secondary font-medium">暂无此类优惠券</p>
                <p className="text-xs text-text-tertiary mt-1">去积分中心看看吧</p>
              </div>
            ) : (
              (activeTab === 'available' ? groupedVouchers.available : groupedVouchers.unavailable).map((v) => {
                const isSelected = tempSelectedVoucher?.id === v.id;
                const voucherData = v.voucher;
                const isAvailable = v.valid;

                return (
                  <div
                    key={v.id}
                    onClick={() => isAvailable && setTempSelectedVoucher(v)}
                    className={`
                      relative group border rounded-2xl transition-all duration-300 overflow-hidden
                      ${isSelected ? 'border-accent ring-1 ring-accent/30 bg-accent/[0.02] shadow-sm' : 'border-border-subtle bg-white hover:border-accent/30 hover:shadow-card'}
                      ${isAvailable ? 'cursor-pointer' : 'opacity-60 grayscale-[0.8] cursor-not-allowed'}
                    `}
                  >
                    <div className="p-4 pr-5">
                      {/* 券面装饰线 - 仅在可用时稍微明显 */}
                      <div className={`
                        absolute top-0 right-0 w-24 h-24 -mt-12 -mr-12 rounded-full blur-2xl transition-colors
                        ${isAvailable ? 'bg-accent/[0.05] group-hover:bg-accent/[0.08]' : 'bg-transparent'}
                      `} />

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className={`font-bold text-base ${isAvailable ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {voucherData?.name}
                            </h3>
                            {v.isNew && isAvailable && <Badge variant="warning" size="sm" className="scale-90 origin-left">NEW</Badge>}
                          </div>

                          <div className={`flex items-baseline gap-1 mb-2.5 ${isAvailable ? 'text-accent' : 'text-text-tertiary'}`}>
                            <span className="text-2xl font-black font-mono leading-none">
                              {voucherData?.type === 'percentage' ? '' : 'RM'}
                              {typeof voucherData?.value === 'object' ? voucherData.value.toNumber() : voucherData?.value}
                              {voucherData?.type === 'percentage' ? '%' : ''}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">OFF</span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                              <span className="w-1 h-1 bg-current opacity-30 rounded-full" />
                              最低消费: {formatCurrency(Number(voucherData?.minPurchase || 0))}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary/70">
                              <span className="w-1 h-1 bg-current opacity-30 rounded-full" />
                              有效期至: {formatDate(v.expiry || voucherData?.validUntil)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 ml-4 min-w-[80px]">
                          {isSelected && isAvailable && (
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white shadow-glow animate-fade-in">
                              <svg className="w-3.5 h-3.5" fill="none" strokeWidth="3.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {!isAvailable && (
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink-elevated border border-border-subtle text-text-tertiary">
                                {v.error}
                              </span>
                              {v.lackAmount > 0 && (
                                <p className="text-[10px] text-accent/80 font-bold bg-accent/[0.08] px-2 py-0.5 rounded-md">
                                  还差 RM {v.lackAmount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Confirmation Bar - Solid White */}
          <div className="p-5 px-6 border-t border-border-subtle bg-white sticky bottom-0 z-10 flex items-center justify-between gap-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold mb-1 opacity-70">当前已选择</p>
              <p className="text-sm font-bold text-text-primary truncate">
                {tempSelectedVoucher ? tempSelectedVoucher.voucher?.name : '暂不使用'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-text-tertiary hover:text-text-primary text-xs font-bold"
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                className="shadow-glow px-7 text-xs h-10 font-bold rounded-xl"
              >
                确认使用
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
