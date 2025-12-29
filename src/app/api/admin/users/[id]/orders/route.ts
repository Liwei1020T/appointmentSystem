/**
 * Admin - User orders API
 * GET /api/admin/users/[id]/orders
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          price: true,
          usePackage: true,
          createdAt: true,
          string: { select: { brand: true, model: true } },
          items: {
            select: {
              id: true,
              tensionVertical: true,
              tensionHorizontal: true,
              price: true,
              string: { select: { brand: true, model: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.id.slice(0, 8).toUpperCase(),
      order_number: o.id.slice(0, 8).toUpperCase(),
      status: o.status,
      totalAmount: Number(o.price ?? 0),
      total_amount: Number(o.price ?? 0),
      price: Number(o.price ?? 0),
      usePackage: Boolean(o.usePackage),
      use_package: Boolean(o.usePackage),
      createdAt: o.createdAt,
      created_at: o.createdAt,
      string: o.string
        ? { name: `${o.string.brand} ${o.string.model}`, brand: o.string.brand }
        : undefined,
      items: (o.items || []).map((item) => ({
        id: item.id,
        tensionVertical: item.tensionVertical,
        tensionHorizontal: item.tensionHorizontal,
        price: Number(item.price ?? 0),
        string: item.string
          ? { brand: item.string.brand, model: item.string.model }
          : undefined,
      })),
    }));

    return successResponse(
      {
        data: mapped,
        total,
        page,
        limit,
      },
      '获取订单成功'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
