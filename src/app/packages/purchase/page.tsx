/**
 * 套餐购买流程路由页面
 */

import { Metadata } from 'next';
import PackagePurchaseFlow from '@/features/packages/PackagePurchaseFlow';
import PageLoading from '@/components/loading/PageLoading';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '购买套餐 | String Service Platform',
  description: '完成套餐购买支付',
};

export default function PackagePurchaseRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PackagePurchaseFlow />
    </Suspense>
  );
}
