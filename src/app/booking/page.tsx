/**
 * 预约页面路由 (Booking Route Page)
 * 
 * Next.js App Router 页面文件
 * 使用多球拍预约流程，支持单支或多支球拍
 */

import MultiRacketBookingFlow from '@/features/booking/MultiRacketBookingFlow';

export const metadata = {
  title: '立即预约 | String Service Platform',
  description: '预约羽毛球穿线服务 - 支持多支球拍',
};

export default function Page() {
  return <MultiRacketBookingFlow />;
}
