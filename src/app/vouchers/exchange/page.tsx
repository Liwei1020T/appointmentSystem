/**
 * 优惠券兑换页面路由
 * 重定向到统一的积分中心
 */

import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '兑换优惠券 | String Service Platform',
  description: '使用积分兑换优惠券',
};

export default function VoucherExchangeRoutePage() {
  redirect('/profile/points?tab=exchange');
}
