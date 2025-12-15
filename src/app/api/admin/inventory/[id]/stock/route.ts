/**
 * 库存调整 API
 * POST /api/admin/inventory/[id]/stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const stringId = params.id;
    const body = await request.json();
    const { change, type, reason } = body;

    if (change === undefined || change === 0) {
      return errorResponse('变更数量不能为空或为0');
    }

    // 验证库存是否存在
    const string = await prisma.stringInventory.findUnique({
      where: { id: stringId },
    });

    if (!string) {
      return errorResponse('库存不存在', 404);
    }

    // 如果是减少库存，检查是否足够
    const newStock = string.stock + change;
    if (newStock < 0) {
      return errorResponse(`库存不足，当前库存: ${string.stock}，变更量: ${change}`);
    }

    // 执行事务
    const result = await prisma.$transaction(async (tx) => {
      // 更新库存
      const updated = await tx.stringInventory.update({
        where: { id: stringId },
        data: {
          stock: { increment: change },
        },
      });

      // 记录库存变更日志
      await tx.stockLog.create({
        data: {
          stringId,
          change,
          type: type || (change > 0 ? 'restock' : 'adjustment'),
          notes: reason || `管理员调整库存: ${change > 0 ? '+' : ''}${change}`,
          createdBy: admin.id,
        },
      });

      return updated;
    });

    return successResponse(result, '库存调整成功');
  } catch (error: any) {
    console.error('Adjust stock error:', error);
    return errorResponse(error.message || '调整库存失败', 500);
  }
}
