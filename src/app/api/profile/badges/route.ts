/**
 * 用户徽章 API
 * GET /api/profile/badges - 获取当前用户的徽章列表
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { getUserBadges, BADGE_CONFIG } from '@/server/services/referral.service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('请先登录', 401);
    }

    const badges = await getUserBadges(session.user.id);

    // 返回已获得徽章和所有可获得徽章的完整列表
    const allBadges = Object.entries(BADGE_CONFIG).map(([type, config]) => {
      const earned = badges.find((b) => b.type === type);
      return {
        type,
        name: config.name,
        icon: config.icon,
        description: config.description,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
      };
    });

    return successResponse({
      earnedBadges: badges,
      allBadges,
      totalEarned: badges.length,
      totalAvailable: Object.keys(BADGE_CONFIG).length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
