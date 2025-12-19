/**
 * Admin - User packages API
 * GET /api/admin/users/[id]/packages
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const userId = params.id;
    if (!isValidUUID(userId)) return errorResponse('无效的用户ID', 400);

    const userPackages = await prisma.userPackage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });

    const mapped = userPackages.map((up) => ({
      id: up.id,
      packageId: up.packageId,
      package_id: up.packageId,
      packageName: up.package?.name ?? '',
      package_name: up.package?.name ?? '',
      package: up.package
        ? { name: up.package.name, times: up.package.times }
        : undefined,
      remaining: up.remaining,
      remainingSessions: up.remaining,
      remaining_sessions: up.remaining,
      totalSessions: up.originalTimes,
      total_sessions: up.originalTimes,
      originalTimes: up.originalTimes,
      original_times: up.originalTimes,
      purchaseDate: up.createdAt,
      purchase_date: up.createdAt,
      expiry: up.expiry,
      expiryDate: up.expiry,
      expiry_date: up.expiry,
      status: up.status,
    }));

    return successResponse({ data: mapped }, '获取套餐成功');
  } catch (error: any) {
    if (error?.json) return error.json();
    console.error('Admin get user packages error:', error);
    return errorResponse(error.message || '获取用户套餐失败', 500);
  }
}

