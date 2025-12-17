/**
 * 删除订单照片
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const user = await requireAuth();
    const { id: orderId, photoId } = params;

    if (!isValidUUID(orderId) || !isValidUUID(photoId)) {
      return errorResponse('无效的编号', 400);
    }

    const photo = await prisma.$queryRaw<any[]>`
      SELECT id, order_id FROM order_photos WHERE id = CAST(${photoId} AS uuid) LIMIT 1
    `;

    if (!photo.length) {
      return errorResponse('照片不存在', 404);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) return errorResponse('订单不存在', 404);

    const isOwner = order.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse('无权限删除该照片', 403);
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM order_photos WHERE id = $1::uuid`,
      photoId
    );

    return successResponse({ success: true });
  } catch (err: any) {
    if (err?.code === '42P01' || `${err?.message || ''}`.includes('order_photos')) {
      return errorResponse('订单照片表不存在，请先运行数据库迁移后再删除照片', 500);
    }
    if (err?.json) return err;
    console.error('Delete order photo error:', err);
    return errorResponse(err?.message || '删除照片失败', 500);
  }
}
