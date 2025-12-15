/**
 * 我的评价页面路由 (My Reviews Page Route)
 */

import MyReviewsPage from '@/features/profile/MyReviewsPage';

export const metadata = {
  title: '我的评价 - 个人中心',
  description: '查看您的所有订单评价',
};

export default function Page() {
  return <MyReviewsPage />;
}
