/**
 * 我的套餐页面路由 (重定向至统一套餐中心)
 */

import { redirect } from 'next/navigation';

export const metadata = {
    title: '我的套餐 - String Service',
    description: '查看和管理您的套餐',
};

export default function ProfilePackagesRoute() {
    redirect('/packages?tab=my');
}
