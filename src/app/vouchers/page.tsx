import { redirect } from 'next/navigation';

export const metadata = {
  title: '优惠券 - String Service',
};

export default function VouchersRoute() {
  redirect('/profile/points?tab=my');
}
