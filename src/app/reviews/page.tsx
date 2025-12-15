/**
 * 我的评价路由页面
 */

import { Metadata } from 'next';
import MyReviewsPage from '@/features/reviews/MyReviewsPage';

export const metadata: Metadata = {
  title: '我的评价 | String Service Platform',
  description: '查看我的所有订单评价',
};

export default function ReviewsPage() {
  return <MyReviewsPage />;
}
