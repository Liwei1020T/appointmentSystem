/**
 * GET /api/events/active
 * 获取当前生效的促销活动和公告
 */

import { prisma } from '@/lib/prisma';
import { okResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export async function GET() {
  try {
    const now = new Date();

    // 获取当前生效的促销活动
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        OR: [
          { usageLimit: null },
          { usageCount: { lt: prisma.promotion.fields.usageLimit } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        discountType: true,
        discountValue: true,
        minPurchase: true,
        startAt: true,
        endAt: true,
      },
      orderBy: { startAt: 'desc' },
    });

    // 获取当前生效的公告
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        linkUrl: true,
        linkText: true,
        startAt: true,
        endAt: true,
      },
      orderBy: [{ priority: 'desc' }, { startAt: 'desc' }],
    });

    return okResponse({
      promotions,
      announcements,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
