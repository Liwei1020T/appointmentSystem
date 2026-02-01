/**
 * /events 活动中心页面
 */

import EventsPage from '@/features/events/EventsPage';

export const metadata = {
  title: '活动中心 | String Service',
  description: '查看当前促销活动和优惠信息',
};

export default function Page() {
  return <EventsPage />;
}
