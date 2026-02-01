/**
 * GET /api/events/history
 * 获取已结束的活动归档
 */

import { prisma } from '@/lib/prisma';
import { okResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const now = new Date();

    // 获取已结束的促销活动
    const [promotions, promotionsTotal] = await Promise.all([
      prisma.promotion.findMany({
        where: {
          OR: [
            { endAt: { lt: now } },
            { isActive: false },
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
          usageCount: true,
        },
        orderBy: { endAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promotion.count({
        where: {
          OR: [
            { endAt: { lt: now } },
            { isActive: false },
          ],
        },
      }),
    ]);

    // 获取已结束的公告
    const [announcements, announcementsTotal] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          OR: [
            { endAt: { lt: now } },
            { isActive: false },
          ],
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
        orderBy: { endAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.announcement.count({
        where: {
          OR: [
            { endAt: { lt: now } },
            { isActive: false },
          ],
        },
      }),
    ]);

    return okResponse({
      promotions,
      announcements,
      pagination: {
        page,
        limit,
        promotionsTotal,
        announcementsTotal,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
