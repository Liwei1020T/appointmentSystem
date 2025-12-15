/**
 * 编辑资料页面路由
 */

import { Metadata } from 'next';
import EditProfilePage from '@/features/profile/EditProfilePage';

export const metadata: Metadata = {
  title: '编辑资料 | String Service Platform',
  description: '编辑个人资料',
};

export default function ProfileEditPage() {
  return <EditProfilePage />;
}
