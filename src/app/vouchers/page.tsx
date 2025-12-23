/**
 * 优惠券页面路由
 * 重定向到统一的积分中心
 */

import { redirect } from 'next/navigation';

export default function Vouchers() {
  redirect('/profile/points?tab=my');
}
