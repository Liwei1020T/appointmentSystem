/**
 * 套餐中心路由页面
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import PackagesCenter from '@/features/packages/PackagesCenter';

export const metadata: Metadata = {
  title: '套餐中心 | String Service Platform',
  description: '查看已购套餐或购买新优惠套餐',
};

export default function PackagesRoute() {
  return (
    <Suspense fallback={null}>
      <PackagesCenter />
    </Suspense>
  );
}
