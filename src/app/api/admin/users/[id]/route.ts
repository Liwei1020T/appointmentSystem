/**
 * Admin - User detail API
 * GET /api/admin/users/[id]
 * PUT /api/admin/users/[id]
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

function mapUserToPayload(user: any) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    full_name: user.fullName,
    points: user.points,
    role: user.role,
    referralCode: user.referralCode,
    referral_code: user.referralCode,
    referredBy: user.referredBy,
    referred_by: user.referredBy,
    createdAt: user.createdAt,
    created_at: user.createdAt,
    updatedAt: user.updatedAt,
    updated_at: user.updatedAt,
    // Block feature not modeled yet
    isBlocked: false,
    is_blocked: false,
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        points: true,
        role: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return errorResponse('用户不存在', 404);

    return successResponse({ user: mapUserToPayload(user) });
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Admin get user by id error:', error);
    return errorResponse(error.message || '获取用户失败', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const body = await request.json().catch(() => ({}));
    const { email, phone, fullName, role } = body || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof email === 'string' ? { email } : {}),
        ...(typeof phone === 'string' ? { phone } : {}),
        ...(typeof fullName === 'string' ? { fullName } : {}),
        ...(typeof role === 'string' ? { role } : {}),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        points: true,
        role: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ user: mapUserToPayload(updated) }, '用户更新成功');
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Admin update user error:', error);
    return errorResponse(error.message || '更新用户失败', 500);
  }
}

