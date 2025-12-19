/**
 * Admin - User points log API
 * GET /api/admin/users/[id]/points-log
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.pointsLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointsLog.count({ where: { userId } }),
    ]);

    const mapped = logs.map((l) => ({
      id: l.id,
      amount: l.amount,
      points: l.amount,
      type: l.amount > 0 ? 'earned' : l.amount < 0 ? 'spent' : 'adjusted',
      source: l.type,
      reason: l.description || '',
      description: l.description || '',
      createdAt: l.createdAt,
      created_at: l.createdAt,
      balanceAfter: l.balanceAfter,
      balance_after: l.balanceAfter,
    }));

    return successResponse({ data: mapped, total, page, limit }, '获取积分记录成功');
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Admin get user points log error:', error);
    return errorResponse(error.message || '获取积分记录失败', 500);
  }
}

