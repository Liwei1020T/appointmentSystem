/**
 * 修改密码页面路由
 */

import { Metadata } from 'next';
import ChangePasswordPage from '@/features/profile/ChangePasswordPage';

export const metadata: Metadata = {
  title: '修改密码 | String Service Platform',
  description: '修改登录密码',
};

export default function ProfilePasswordPage() {
  return <ChangePasswordPage />;
}
