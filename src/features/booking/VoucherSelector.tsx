/**
 * 优惠券选择组件 (Voucher Selector)
 * 
 * 显示用户可用优惠券，选择应用折扣
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, Badge, Spinner, Modal } from '@/components';
import { getUserVouchers, calculateDiscount, validateVoucherForOrder, UserVoucherWithVoucher } from '@/services/voucherService';
import { UserVoucher } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface VoucherSelectorProps {
  orderAmount: number;
  selectedVoucher: UserVoucher | null;
  onSelect: (voucher: UserVoucher | null) => void;
}

export default function VoucherSelector({ orderAmount, selectedVoucher, onSelect }: VoucherSelectorProps) {
  const [vouchers, setVouchers] = useState<UserVoucherWithVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    const { vouchers: data } = await getUserVouchers();
    if (data) {
      setVouchers(data);
    }
    setLoading(false);
  };

  const handleVoucherSelect = (voucher: any) => {
    const { valid } = validateVoucherForOrder(voucher, orderAmount);
    if (valid) {
      onSelect(selectedVoucher?.id === voucher.id ? null : voucher as UserVoucher);
      setShowModal(false);
    }
  };

  const discount = selectedVoucher ? calculateDiscount(selectedVoucher, orderAmount) : 0;

  if (loading) {
    return (
      <Card>
        <div className="p-4 flex items-center justify-center">
          <Spinner size="small" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card onClick={() => setShowModal(true)} className="cursor-pointer hover:bg-ink-elevated/70 transition-colors">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink-elevated rounded-full flex items-center justify-center border border-border-subtle">
                <svg className="w-5 h-5 text-warning" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {selectedVoucher ? '已选择优惠券' : '选择优惠券'}
                </p>
                <p className="text-xs text-text-tertiary">
                  {selectedVoucher
                    ? `${selectedVoucher.voucher?.description || '优惠券'}`
                    : `${vouchers.length} 张可用`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {selectedVoucher ? (
                <p className="text-lg font-bold text-warning font-mono">
                  -{formatCurrency(discount)}
                </p>
              ) : (
                <svg className="w-5 h-5 text-text-tertiary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 5l7 7-7 7"></path>
                </svg>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 优惠券选择弹窗 */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="选择优惠券">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {vouchers.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <p className="mb-2">暂无可用优惠券</p>
                <p className="text-sm">使用积分兑换优惠券</p>
              </div>
            ) : (
              <>
                {/* 不使用优惠券选项 */}
                <Card
                  onClick={() => {
                    onSelect(null);
                    setShowModal(false);
                  }}
                  className={`cursor-pointer transition-all ${
                    !selectedVoucher
                      ? 'ring-2 ring-accent-border bg-ink-elevated'
                      : 'hover:bg-ink-elevated/70'
                  }`}
                >
                  <div className="p-4">
                    <p className="font-medium text-text-primary">不使用优惠券</p>
                  </div>
                </Card>

                {vouchers.map((voucher) => {
                  const { valid, error } = validateVoucherForOrder(voucher, orderAmount);
                  const discountAmount = calculateDiscount(voucher, orderAmount);
                  const voucherData = voucher.voucher;

                  return (
                    <Card
                      key={voucher.id}
                      onClick={() => valid && handleVoucherSelect(voucher)}
                      className={`transition-all ${
                        valid ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      } ${
                        selectedVoucher?.id === voucher.id
                          ? 'ring-2 ring-accent-border bg-ink-elevated'
                          : valid ? 'hover:bg-ink-elevated/70' : ''
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">
                              {voucherData?.name || '优惠券'}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {voucherData?.type === 'PERCENTAGE' || voucherData?.type === 'percentage'
                                ? `${typeof voucherData.value === 'object' ? voucherData.value.toNumber() : voucherData.value}% 折扣`
                                : `${formatCurrency(typeof voucherData.value === 'object' ? voucherData.value.toNumber() : (voucherData.value ?? 0))} 折扣`}
                            </p>
                            {voucherData?.minPurchase && (
                              <p className="text-xs text-text-tertiary mt-1">
                                最低消费: {formatCurrency(typeof voucherData.minPurchase === 'object' ? voucherData.minPurchase.toNumber() : voucherData.minPurchase)}
                              </p>
                            )}
                            {(voucher.expiry || voucherData?.validUntil) && (
                              <p className="text-xs text-text-tertiary mt-1">
                                有效期至: {formatDate(voucher.expiry || voucherData.validUntil)}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            {valid ? (
                              <p className="text-lg font-bold text-warning font-mono">
                                -{formatCurrency(discountAmount)}
                              </p>
                            ) : (
                              <Badge variant="neutral">{error}</Badge>
                            )}
                          </div>
                        </div>

                        {selectedVoucher?.id === voucher.id && (
                          <div className="mt-3 pt-3 border-t border-accent-border">
                            <div className="flex items-center text-sm text-accent">
                              <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                              已选择
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
