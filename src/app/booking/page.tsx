/**
 * 预约页面路由 (Booking Route Page)
 * 
 * Next.js App Router 页面文件
 */

import BookingFlow from '@/features/booking/BookingFlow';

export const metadata = {
  title: '立即预约 | String Service Platform',
  description: '预约羽毛球穿线服务',
};

export default function Page() {
  return <BookingFlow />;
}
