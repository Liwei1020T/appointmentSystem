/**
 * 调整订单照片顺序
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    const body = await request.json();
    const photos: { id: string; displayOrder: number }[] = body.photos || [];

    if (!Array.isArray(photos)) {
      return errorResponse('参数错误', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) return errorResponse('订单不存在', 404);

    const isOwner = order.userId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse('无权限更新照片顺序', 403);
    }

    await prisma.$transaction(
      photos.map((p) =>
        prisma.$executeRawUnsafe(
          `UPDATE order_photos SET display_order = $1 WHERE id = $2::uuid AND order_id = $3::uuid`,
          p.displayOrder,
          p.id,
          orderId
        )
      )
    );

    return successResponse({ success: true });
  } catch (err: any) {
    if (err?.code === '42P01' || `${err?.message || ''}`.includes('order_photos')) {
      return errorResponse('订单照片表不存在，请先运行数据库迁移后再调整顺序', 500);
    }
    if (err?.json) return err;
    console.error('Reorder order photos error:', err);
    return errorResponse(err?.message || '更新照片顺序失败', 500);
  }
}
