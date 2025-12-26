/**
 * Server-side Auth Utilities
 * 用于 API Routes 和 Server Components
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { failResponse } from '@/lib/api-response';
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
    const error = new ApiError('UNAUTHORIZED', 401, 'Unauthorized');
    (error as any).json = () => failResponse('UNAUTHORIZED', '未登录', 401);
    throw error;
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
    const error = new ApiError('FORBIDDEN', 403, 'Forbidden');
    (error as any).json = () => failResponse('FORBIDDEN', '需要管理员权限', 403);
    throw error;
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
