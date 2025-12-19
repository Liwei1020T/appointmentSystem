/**
 * Update Password API (Authenticated)
 * PUT /api/user/password
 *
 * Purpose:
 * - Allow logged-in users to change their password.
 *
 * Request:
 * - currentPassword?: string (required if a password already exists)
 * - newPassword: string
 *
 * Response:
 * - { success: true }
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/server-auth';
import { validatePassword } from '@/lib/utils';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const currentPassword = body?.currentPassword ? String(body.currentPassword) : '';
    const newPassword = String(body?.newPassword || '');

    if (!newPassword.trim()) {
      return errorResponse('请输入新密码');
    }
    if (!validatePassword(newPassword)) {
      return errorResponse('密码至少8位，包含大小写字母和数字');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    // If user already has a password, require currentPassword verification
    if (dbUser?.password) {
      if (!currentPassword.trim()) {
        return errorResponse('请输入当前密码');
      }

      const ok = await bcrypt.compare(currentPassword, dbUser.password);
      if (!ok) {
        return errorResponse('当前密码错误');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ ok: true }, '密码已更新');
  } catch (error: any) {
    if (typeof error?.json === 'function') return error.json();
    console.error('Update password error:', error);
    return errorResponse('修改密码失败', 500);
  }
}

