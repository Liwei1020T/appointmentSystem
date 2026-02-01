/**
 * Admin - User detail API
 * GET /api/admin/users/[id]
 * PUT /api/admin/users/[id]
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, failResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

// 有效的角色列表
const VALID_ROLES = ['user', 'admin', 'super_admin'] as const;

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  fullName: z.string().min(1).max(100).optional(),
  role: z.enum(VALID_ROLES).optional(),
});

type UserRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  points: number;
  role: string;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapUserToPayload(user: UserRecord) {
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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const body = await request.json().catch(() => ({}));

    // 输入验证
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
    }

    // 只有 super_admin 才能修改用户角色
    if (parsed.data.role && admin.role !== 'super_admin') {
      return failResponse('FORBIDDEN', '只有超级管理员可以修改用户角色', 403);
    }

    // 防止自己降级自己
    if (parsed.data.role && userId === admin.id && parsed.data.role !== 'super_admin') {
      return failResponse('FORBIDDEN', '不能降级自己的权限', 403);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
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
  } catch (error) {
    return handleApiError(error);
  }
}
