/**
 * 管理员 - 更新用户角色 API
 * PATCH /api/admin/users/[id]/role
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

async function handleUpdateRole(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const body = await request.json();
  const { role } = body;

  const normalizedRole = role === 'user' ? 'customer' : role;
  if (!normalizedRole || typeof normalizedRole !== 'string') {
    return errorResponse('无效的角色');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: normalizedRole },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  return successResponse(user, '角色更新成功');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    return await handleUpdateRole(request, { params });
  } catch (error) {
    return handleApiError(error);
  }
}

// Backward-compatible method used by some clients
export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    await requireAdmin();
    return await handleUpdateRole(request, ctx);
  } catch (error) {
    return handleApiError(error);
  }
}
