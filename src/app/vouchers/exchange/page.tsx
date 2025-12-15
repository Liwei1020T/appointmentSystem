/**
 * 优惠券兑换页面路由
 */

import { Metadata } from 'next';
import VoucherExchangePage from '@/features/vouchers/VoucherExchangePage';

export const metadata: Metadata = {
  title: '兑换优惠券 | String Service Platform',
  description: '使用积分兑换优惠券',
};

export default function VoucherExchangeRoutePage() {
  return <VoucherExchangePage />;
}
