/**
 * 优惠券兑换页面路由
 * 路径: /vouchers/exchange
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: '优惠券兑换 - String Service',
};

export default function VoucherExchangeRoute() {
  redirect('/profile/points?tab=exchange');
}
