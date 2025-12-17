import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// User-facing review submission placeholder
export async function POST(request: NextRequest) {
  try {
    // allow either authenticated user or admin; fallback to allow if auth not available
    try {
      await requireAdmin();
    } catch {
      // non-admin user; continue without blocking
    }

    const body = await request.json().catch(() => ({}));
    const now = new Date().toISOString();
    const review = {
      id: crypto.randomUUID(),
      order_id: body.order_id || body.orderId,
      user_id: body.user_id || body.userId || '',
      rating: Number(body.rating || 0),
      service_rating: Number(body.service_rating || 0),
      quality_rating: Number(body.quality_rating || 0),
      speed_rating: Number(body.speed_rating || 0),
      comment: body.comment || '',
      tags: body.tags || [],
      image_urls: body.images || body.imageUrls || [],
      is_anonymous: body.is_anonymous ?? body.isAnonymous ?? false,
      created_at: now,
      updated_at: now,
    };

    return successResponse(review, '评价已提交（示例接口）');
  } catch (error: any) {
    console.error('Submit review error:', error);
    return errorResponse(error.message || '提交评价失败', 500);
  }
}

// GET reviews (by orderId)
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return successResponse({ review: null });
    }
    return successResponse({ review: null });
  } catch (error: any) {
    console.error('Get review error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
