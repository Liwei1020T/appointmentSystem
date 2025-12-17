/**
 * 订单照片 API
 * GET: 获取订单照片（用户本人或管理员）
 * POST: 创建订单照片（管理员或订单本人）
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) return errorResponse('订单不存在', 404);
    const isOwner = order.userId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) return errorResponse('无权限查看该订单', 403);

    // 查询订单照片，如果表不存在或没有照片，返回空数组
    try {
      const photos = await prisma.$queryRaw<any[]>`
        SELECT id, order_id, photo_url, photo_type, caption, display_order, created_at
        FROM order_photos
        WHERE order_id = CAST(${orderId} AS uuid)
        ORDER BY display_order ASC, created_at DESC
      `;
      return successResponse(photos || []);
    } catch (dbErr: any) {
      if (dbErr?.code === '42P01' || `${dbErr?.message || ''}`.includes('order_photos')) {
        console.warn('order_photos table missing, returning empty list');
        return successResponse([]);
      }
      throw dbErr;
    }
  } catch (err: any) {
    if (err?.json) return err.json();
    console.error('Get order photos error:', err);
    return errorResponse(err?.message || '获取订单照片失败', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    const { photoUrl, photoType = 'other', caption = null, displayOrder = 0 } = await request.json();

    if (!photoUrl || typeof photoUrl !== 'string') {
      return errorResponse('缺少照片地址', 400);
    }

    const validTypes = ['before', 'after', 'detail', 'other'];
    if (!validTypes.includes(photoType)) {
      return errorResponse('无效的照片类型', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) return errorResponse('订单不存在', 404);
    const isOwner = order.userId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) return errorResponse('无权限保存照片', 403);

    const inserted = await prisma.$queryRaw<any[]>`
      INSERT INTO order_photos (order_id, photo_url, photo_type, caption, display_order, uploaded_by)
      VALUES (
        CAST(${orderId} AS uuid),
        ${photoUrl},
        ${photoType},
        ${caption},
        ${displayOrder},
        CAST(${user.id} AS uuid)
      )
      RETURNING id, order_id, photo_url, photo_type, caption, display_order, created_at
    `;

    return successResponse(inserted[0]);
  } catch (err: any) {
    if (err?.code === '42P01' || `${err?.message || ''}`.includes('order_photos')) {
      return errorResponse('订单照片表不存在，请先运行数据库迁移后再上传照片', 500);
    }
    if (err?.json) return err.json();
    console.error('Create order photo error:', err);
    return errorResponse(err?.message || '保存照片失败', 500);
  }
}
