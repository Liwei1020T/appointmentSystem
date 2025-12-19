'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin Index Page - Redirects to Dashboard
 * This page redirects /admin to /admin/dashboard
 * to ensure a consistent entry point for the admin interface.
 */
export default function AdminIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ink">
      <div className="text-text-secondary">重定向到管理后台...</div>
    </div>
  );
}
