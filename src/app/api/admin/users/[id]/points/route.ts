/**
 * 管理员 - 更新用户积分 API
 * POST /api/admin/users/[id]/points
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { AppError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

const MAX_POINTS_ADJUSTMENT = 1_000_000;

const updatePointsSchema = z
  .object({
    points: z.coerce.number().int().min(-MAX_POINTS_ADJUSTMENT).max(MAX_POINTS_ADJUSTMENT).optional(),
    amount: z.coerce.number().int().min(-MAX_POINTS_ADJUSTMENT).max(MAX_POINTS_ADJUSTMENT).optional(),
    type: z.enum(['add', 'subtract', 'set']).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.type && data.points === undefined) return false;
      if (!data.type && (data.amount === undefined || data.amount === 0)) return false;
      return true;
    },
    { message: '请提供积分数量' }
  );

async function handleUpdatePoints(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const body = await request.json().catch(() => ({}));

  const parsed = updatePointsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message || '请提供积分数量', 400);
  }

  const { points, amount, type, reason } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!existing) {
      throw new AppError('NOT_FOUND', 404, '用户不存在');
    }

    let delta = amount ?? 0;
    if (type === 'add') delta = Math.abs(points ?? 0);
    if (type === 'subtract') delta = -Math.abs(points ?? 0);
    if (type === 'set') delta = (points ?? 0) - Number(existing.points ?? 0);

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
