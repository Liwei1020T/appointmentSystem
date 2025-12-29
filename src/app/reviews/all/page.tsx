/**
 * 全部评价路由页面
 */

import { Metadata } from 'next';
import AllReviewsPage from '@/features/reviews/AllReviewsPage';

export const metadata: Metadata = {
  title: '全部评价 | String Service Platform',
  description: '查看全部用户评价',
};

export default function ReviewsAllPage() {
  return <AllReviewsPage />;
}
