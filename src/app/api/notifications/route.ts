/**
 * 获取通知列表 API
 * GET /api/notifications
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = searchParams.get('limit');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: parseInt(limit) }),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return errorResponse(error.message || '获取通知失败', 500);
  }
}

/**
 * 标记通知为已读 API
 * POST /api/notifications/mark-read
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });
    } else if (notificationId) {
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id,
        },
        data: {
          read: true,
        },
      });
    } else {
      return errorResponse('请提供 notificationId 或 markAll');
    }

    return successResponse({}, '标记成功');
  } catch (error: any) {
    console.error('Mark read error:', error);
    return errorResponse(error.message || '标记失败', 500);
  }
}
