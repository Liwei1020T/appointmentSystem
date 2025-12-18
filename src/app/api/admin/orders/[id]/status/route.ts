/**
 * 管理员更新订单状态
 * PUT /api/admin/orders/[id]/status
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

const ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'in_progress',
  'ready',
  'completed',
  'cancelled',
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const orderId = params.id;

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单编号', 400);
    }

    const body = await request.json().catch(() => ({}));
    const status = body.status as string | undefined;
    const adminNotes = body.notes as string | undefined;

    if (!status || !ALLOWED_STATUSES.includes(status as any)) {
      return errorResponse('无效的订单状态', 400);
    }

    // 获取当前订单以保留客户备注
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { notes: true },
    });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        // 说明：orders 表目前没有 metadata 字段，避免写入不存在字段导致构建/运行错误。
        // 保留客户原始备注；如需管理员备注，建议未来新增独立字段或表来存储。
        notes: currentOrder?.notes, // 不覆盖客户备注
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        string: true,
        payments: true,
        packageUsed: {
          include: {
            package: true,
          },
        },
        voucherUsed: {
          include: {
            voucher: true,
          },
        },
      },
    });

    return successResponse({ order });
  } catch (error: any) {
    console.error('Admin update order status error:', error);
    return errorResponse(error.message || '更新订单状态失败', 500);
  }
}
