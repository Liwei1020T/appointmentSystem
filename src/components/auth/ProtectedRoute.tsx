'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdminRole } from '@/lib/roles';
import PageLoading from '@/components/loading/PageLoading';

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
    return <PageLoading />;
  }

  if (!session) {
    return null;
  }

  if (requireAdmin && !isAdminRole(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
