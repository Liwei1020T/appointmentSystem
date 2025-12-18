/**
 * Admin Layout with Sidebar Navigation
 * 管理后台布局（带侧边栏导航）
 */

'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Users, 
  Tag, 
  BarChart3,
  CreditCard,
  MessageSquare
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const sidebarItems = [
    {
      icon: <LayoutDashboard className="w-full h-full" />,
      label: '仪表板',
      href: '/admin/dashboard',
      active: pathname === '/admin/dashboard',
    },
    {
      icon: <ClipboardList className="w-full h-full" />,
      label: '订单管理',
      href: '/admin/orders',
      active: pathname === '/admin/orders',
    },
    {
      icon: <Package className="w-full h-full" />,
      label: '库存管理',
      href: '/admin/inventory',
      active: pathname === '/admin/inventory',
    },
    {
      icon: <Users className="w-full h-full" />,
      label: '用户管理',
      href: '/admin/users',
      active: pathname === '/admin/users',
    },
    {
      icon: <Tag className="w-full h-full" />,
      label: '套餐管理',
      href: '/admin/packages',
      active: pathname === '/admin/packages',
    },
    {
      icon: <Tag className="w-full h-full" />,
      label: '优惠券管理',
      href: '/admin/vouchers',
      active: pathname === '/admin/vouchers',
    },
    {
      icon: <MessageSquare className="w-full h-full" />,
      label: '评价管理',
      href: '/admin/reviews',
      active: pathname.startsWith('/admin/reviews'),
    },
    {
      icon: <CreditCard className="w-full h-full" />,
      label: '支付审核',
      href: '/admin/payments',
      active: pathname === '/admin/payments',
    },
    {
      icon: <BarChart3 className="w-full h-full" />,
      label: '报表分析',
      href: '/admin/reports',
      active: pathname === '/admin/reports',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar items={sidebarItems} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
