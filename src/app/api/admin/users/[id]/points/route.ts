/**
 * 管理员 - 更新用户积分 API
 * POST /api/admin/users/[id]/points
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

async function handleUpdatePoints(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const body = await request.json().catch(() => ({}));

  // Support legacy `{ amount, reason }` and new `{ points, reason, type }`
  const amountRaw = body?.amount;
  const pointsRaw = body?.points;
  const reason = body?.reason;
  const type = body?.type as 'add' | 'subtract' | 'set' | undefined;

  const points = Number.isFinite(Number(pointsRaw)) ? Number(pointsRaw) : null;
  const amount = Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : null;

  if (type && points === null) {
    return errorResponse('请提供积分数量', 400);
  }

  if (!type && (amount === null || amount === 0)) {
    return errorResponse('请提供积分数量', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!existing) {
      throw new Error('用户不存在');
    }

    let delta = amount ?? 0;
    if (type === 'add') delta = Math.abs(points!);
    if (type === 'subtract') delta = -Math.abs(points!);
    if (type === 'set') delta = points! - Number(existing.points ?? 0);

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        points: { increment: delta },
      },
      select: { points: true },
    });

    const logType =
      type === 'set'
        ? 'admin_set'
        : delta >= 0
        ? 'admin_grant'
        : 'admin_deduct';

    await tx.pointsLog.create({
      data: {
        userId,
        amount: delta,
        type: logType,
        description: reason || 'Admin adjustment',
        balanceAfter: updatedUser.points,
      },
    });

    return { newBalance: updatedUser.points, delta };
  });

  return successResponse({ newBalance: result.newBalance, delta: result.delta }, '积分更新成功');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    return await handleUpdatePoints(request, { params });
  } catch (error) {
    return handleApiError(error);
  }
}

// Backward-compatible method used by some clients
export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    await requireAdmin();
    return await handleUpdatePoints(request, ctx);
  } catch (error) {
    return handleApiError(error);
  }
}
