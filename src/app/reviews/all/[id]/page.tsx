/**
 * 评价详情路由页面
 */

import { Metadata } from 'next';
import ReviewDetailPage from '@/features/reviews/ReviewDetailPage';

export const metadata: Metadata = {
  title: '评价详情 | String Service Platform',
  description: '查看完整评价内容',
};

export default function ReviewDetailRoute() {
  return <ReviewDetailPage />;
}
