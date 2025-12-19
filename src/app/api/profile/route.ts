/**
 * 获取用户个人资料 API
 * GET /api/profile
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        points: true,
        referralCode: true,
        referredBy: true,
        role: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return errorResponse('用户不存在', 404);
    }

    // 获取统计信息
    const [orderCount, packageCount, voucherCount] = await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.userPackage.count({ where: { userId: user.id, status: 'active' } }),
      prisma.userVoucher.count({ where: { userId: user.id, status: 'active' } }),
    ]);

    return successResponse({
      ...profile,
      full_name: profile.fullName,
      avatar_url: profile.avatarUrl,
      stats: {
        totalOrders: orderCount,
        activePackages: packageCount,
        activeVouchers: voucherCount,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return errorResponse(error.message || '获取个人资料失败', 500);
  }
}

/**
 * 更新用户个人资料 API
 * PATCH /api/profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { fullName, full_name, phone, address, avatar_url, avatarUrl } = body;
    const resolvedFullName = fullName ?? full_name;
    const resolvedAvatarUrl = avatarUrl ?? avatar_url;
    const updateData: Record<string, unknown> = {};

    if (resolvedFullName !== undefined) {
      updateData.fullName = resolvedFullName;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (address !== undefined) {
      updateData.address = address;
    }
    if (resolvedAvatarUrl !== undefined) {
      updateData.avatarUrl = resolvedAvatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        points: true,
        referralCode: true,
      },
    });

    return successResponse(
      {
        ...updatedUser,
        full_name: updatedUser.fullName,
        avatar_url: updatedUser.avatarUrl,
      },
      '资料更新成功'
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return errorResponse(error.message || '更新资料失败', 500);
  }
}
