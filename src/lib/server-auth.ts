/**
 * Server-side Auth Utilities
 * 用于 API Routes 和 Server Components
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    throw new Error('未登录');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('需要管理员权限');
  }
  
  return user;
}

export async function getUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
