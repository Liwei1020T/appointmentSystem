/**
 * Server-side Auth Utilities
 * 用于 API Routes 和 Server Components
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/api-errors';
import { isAdminRole } from '@/lib/roles';

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      points: true,
      referralCode: true,
      phone: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError('UNAUTHORIZED', 401, '未登录');
  }

  return user;
}

// Alias for consistent naming across API route handlers.
export async function requireUser() {
  return requireAuth();
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (!isAdminRole(user.role)) {
    throw new AppError('FORBIDDEN', 403, '需要管理员权限');
  }

  return user;
}

export async function getUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return isAdminRole(user?.role);
}
