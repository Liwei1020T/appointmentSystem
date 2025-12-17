/**
 * 管理员 - 获取所有订单 API
 * GET /api/admin/orders
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return successResponse({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin get orders error:', error);
    return errorResponse(error.message || '获取订单失败', 500);
  }
}
