/**
 * 管理员 - 更新用户积分 API
 * POST /api/admin/users/[id]/points
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const userId = params.id;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount === 0) {
      return errorResponse('请提供积分数量');
    }

    await prisma.$transaction(async (tx) => {
      // 更新用户积分
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: amount },
        },
      });

      // 记录积分日志
      await tx.pointsLog.create({
        data: {
          userId,
          amount,
          type: amount > 0 ? 'admin_add' : 'admin_deduct',
          description: reason || 'Admin adjustment',
          balanceAfter: user.points,
        },
      });
    });

    return successResponse({}, '积分更新成功');
  } catch (error: any) {
    console.error('Update points error:', error);
    return errorResponse(error.message || '更新积分失败', 500);
  }
}
