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
    const error: any = new Error('未登录');
    error.json = () => Response.json({ error: '未登录' }, { status: 401 });
    throw error;
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    const error: any = new Error('需要管理员权限');
    error.json = () => Response.json({ error: '需要管理员权限' }, { status: 403 });
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
  return user?.role === 'admin';
}
