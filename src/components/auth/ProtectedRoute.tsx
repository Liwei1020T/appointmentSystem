'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdminRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdminRole(session.user.role)) {
      router.push('/');
      return;
    }
  }, [session, status, requireAdmin, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (requireAdmin && !isAdminRole(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
