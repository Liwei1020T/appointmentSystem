/**
 * 管理员 - 获取所有用户 API
 * GET /api/admin/users
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    // Support both `limit` and legacy `pageSize`
    const limit = parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (role && role !== 'all') {
      where.role = role;
    }
    // Note: user "blocked" is not modeled in current schema; keep behavior predictable.
    if (status && status !== 'all') {
      if (status === 'blocked') {
        // No blocked concept yet → return empty set
        where.id = { equals: '__never__' };
      }
      // status === 'active' => no extra filter
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          points: true,
          referralCode: true,
          referredBy: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              userPackages: true,
              userVouchers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
