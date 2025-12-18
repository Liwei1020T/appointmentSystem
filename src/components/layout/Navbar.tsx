'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  /**
   * 套餐相关页面（购买列表 / 购买流程 / 我的套餐）统一高亮。
   *
   * 说明：
   * - “套餐”入口指向 `/profile/packages`（用户已购买/已激活套餐）
   * - `/packages*` 仍用于购买流程，所以也应视为同一导航分组
   */
  const isPackagesActive =
    pathname === '/profile/packages' ||
    pathname?.startsWith('/profile/packages') ||
    pathname?.startsWith('/packages');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                String Service
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/booking"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/booking')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  预约穿线
                </Link>

                <Link
                  href="/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/orders')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  我的订单
                </Link>

                <Link
                  href="/profile/packages"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isPackagesActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  套餐
                </Link>

                <Link
                  href="/profile/vouchers"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname?.startsWith('/profile/vouchers')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  优惠券
                </Link>

                {session.user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname?.startsWith('/admin')
                        ? 'bg-red-100 text-red-700'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    管理后台
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell 
                  userId={session.user.id}
                  onClick={() => setNotificationPanelOpen(true)}
                />

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <span>{session.user.name || session.user.email}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div className="absolute right-0 top-full pt-2 z-50 opacity-0 invisible pointer-events-none transition group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto">
                    <div className="w-48 bg-white rounded-md shadow-lg py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        个人中心
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  登录
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-700 hover:text-blue-600">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {session && (
        <NotificationPanel 
          userId={session.user.id}
          isOpen={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
        />
      )}
    </nav>
  );
}
