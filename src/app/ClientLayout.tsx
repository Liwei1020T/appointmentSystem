/**
 * 客户端布局组件 (Client Layout)
 * 
 * 功能：
 * - 根据设备类型显示不同导航
 * - 移动端：显示 BottomNav
 * - 桌面端：不显示（使用 Navbar）
 */

'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BottomNav } from '@/components/BottomNav';
import { 
  HomeIcon, 
  CalendarIcon, 
  ShoppingBagIcon, 
  UserIcon,
  ClipboardListIcon 
} from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // 不显示底部导航的页面
  const hideBottomNav = pathname?.startsWith('/admin') || 
                        pathname?.startsWith('/login') || 
                        pathname?.startsWith('/signup');

  // 移动端底部导航项
  const navItems = [
    {
      icon: <HomeIcon className="w-full h-full" />,
      label: '首页',
      href: '/',
      active: pathname === '/',
    },
    {
      icon: <CalendarIcon className="w-full h-full" />,
      label: '预约',
      href: '/booking',
      active: pathname === '/booking',
    },
    {
      icon: <ClipboardListIcon className="w-full h-full" />,
      label: '订单',
      href: '/orders',
      active: pathname === '/orders',
    },
    {
      icon: <ShoppingBagIcon className="w-full h-full" />,
      label: '套餐',
      href: '/packages',
      active: pathname === '/packages',
    },
    {
      icon: <UserIcon className="w-full h-full" />,
      label: '我的',
      href: '/profile',
      active: pathname === '/profile',
    },
  ];

  return (
    <>
      {children}
      
      {/* 移动端底部导航 - 仅在已登录且不在管理页面时显示 */}
      {session && !hideBottomNav && (
        <div className="md:hidden">
          <BottomNav items={navItems} />
        </div>
      )}
    </>
  );
}
