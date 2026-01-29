'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';
import { isAdminRole } from '@/lib/roles';
import BrandLogo from '@/components/BrandLogo';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [bellRefreshTrigger, setBellRefreshTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldHideOnLanding = pathname === '/' && status !== 'authenticated';

  // 当通知面板中的未读数量变化时刷新铃铛
  const handleUnreadCountChange = useCallback(() => {
    setBellRefreshTrigger((prev) => prev + 1);
  }, []);

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

  // 路由变化时自动关闭通知面板和手机菜单
  useEffect(() => {
    setNotificationPanelOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Landing page has its own header; avoid rendering the global Navbar there for guests.
  if (shouldHideOnLanding) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 relative">
        <div className="flex justify-between h-16 rounded-2xl bg-white/90 dark:bg-dark-elevated/90 backdrop-blur-md border border-border-subtle dark:border-gray-700 shadow-sm px-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <BrandLogo size="md" showName className="group-hover:opacity-90 transition-opacity" nameClassName="font-display" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/booking"
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${isActive('/booking')
                    ? 'bg-ink text-text-primary dark:bg-gray-700 dark:text-gray-100 ring-1 ring-border-subtle dark:ring-gray-600'
                    : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  预约穿线
                </Link>

                <Link
                  href="/orders"
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${isActive('/orders')
                    ? 'bg-ink text-text-primary dark:bg-gray-700 dark:text-gray-100 ring-1 ring-border-subtle dark:ring-gray-600'
                    : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  我的订单
                </Link>

                <Link
                  href="/profile/packages"
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${isPackagesActive
                    ? 'bg-ink text-text-primary dark:bg-gray-700 dark:text-gray-100 ring-1 ring-border-subtle dark:ring-gray-600'
                    : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  套餐
                </Link>

                <Link
                  href="/profile/points"
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${pathname?.startsWith('/profile/vouchers') || pathname?.startsWith('/profile/points')
                    ? 'bg-ink text-text-primary dark:bg-gray-700 dark:text-gray-100 ring-1 ring-border-subtle dark:ring-gray-600'
                    : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  优惠券
                </Link>

                <Link
                  href="/reviews"
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${pathname === '/reviews' || pathname?.startsWith('/reviews')
                    ? 'bg-ink text-text-primary dark:bg-gray-700 dark:text-gray-100 ring-1 ring-border-subtle dark:ring-gray-600'
                    : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  评价
                </Link>


                {isAdminRole(session.user.role) && (
                  <Link
                    href="/admin/dashboard"
                    className={`px-3 py-2 rounded-xl text-sm font-medium ${pathname?.startsWith('/admin')
                      ? 'bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent ring-1 ring-accent/30 dark:ring-accent/40'
                      : 'text-accent dark:text-accent hover:bg-accent/10 dark:hover:bg-accent/20'
                      }`}
                  >
                    管理后台
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell
                  userId={session.user.id}
                  onClick={() => setNotificationPanelOpen((open) => !open)}
                  refreshTrigger={bellRefreshTrigger}
                />

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700">
                    <span>{session.user.name || session.user.phone || session.user.email || '用户'}</span>
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
                    <div className="w-48 glass-strong dark:bg-dark-elevated dark:border dark:border-gray-700 rounded-xl py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700"
                      >
                        个人中心
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : status === 'unauthenticated' ? (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700"
                >
                  登录
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-text-onAccent bg-accent hover:shadow-sm dark:bg-accent dark:text-white"
                >
                  注册
                </Link>
              </>
            ) : (
              <div className="h-8 w-16" /> // Placeholder while loading
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 p-2"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white dark:bg-dark-elevated border border-border-subtle dark:border-gray-700 shadow-lg py-3 space-y-1 z-50 rounded-2xl mt-3">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/booking"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${isActive('/booking') ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  预约穿线
                </Link>
                <Link
                  href="/orders"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${isActive('/orders') ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  我的订单
                </Link>
                <Link
                  href="/packages"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${isPackagesActive ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  套餐
                </Link>
                <Link
                  href="/profile/vouchers"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${pathname?.startsWith('/profile/vouchers') ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  优惠券
                </Link>
                <Link
                  href="/reviews"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${pathname?.startsWith('/reviews') ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  评价
                </Link>
                <div className="border-t border-border-subtle dark:border-gray-700 my-2" />
                <Link
                  href="/profile"
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${isActive('/profile') ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent' : 'text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700'
                    }`}
                >
                  个人中心
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-text-secondary dark:text-gray-400 hover:bg-ink dark:hover:bg-gray-700"
                >
                  登录
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-accent dark:text-accent hover:bg-accent-soft dark:hover:bg-accent/20"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Notification Panel */}
      {session && (
        <NotificationPanel
          userId={session.user.id}
          isOpen={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
          onUnreadCountChange={handleUnreadCountChange}
        />
      )}
    </nav>
  );
}
