import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAdmin();

    const totalReviews = await prisma.review.count();
    const average = await prisma.review.aggregate({
      _avg: { rating: true, serviceRating: true, qualityRating: true, speedRating: true },
    });

    const ratingGroups = await prisma.review.groupBy({
      by: ['rating'],
      _count: { rating: true },
    });

    const ratingCountMap = ratingGroups.reduce<Record<number, number>>((acc, group) => {
      acc[group.rating] = group._count.rating;
      return acc;
    }, {});

    const averageRating = Number(average._avg.rating || 0);
    const averageService = Number(average._avg.serviceRating || averageRating || 0);
    const averageQuality = Number(average._avg.qualityRating || averageRating || 0);
    const averageSpeed = Number(average._avg.speedRating || averageRating || 0);

    const stats = {
      total_reviews: totalReviews,
      average_rating: averageRating,
      rating_5: ratingCountMap[5] || 0,
      rating_4: ratingCountMap[4] || 0,
      rating_3: ratingCountMap[3] || 0,
      rating_2: ratingCountMap[2] || 0,
      rating_1: ratingCountMap[1] || 0,
      avg_service: averageService,
      avg_quality: averageQuality,
      avg_speed: averageSpeed,
    };

    return successResponse(stats);
  } catch (error: any) {
    console.error('Get review stats error:', error);
    return errorResponse(error.message || '获取评价统计失败', 500);
  }
}
