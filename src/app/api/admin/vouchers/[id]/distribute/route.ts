import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * Admin - Distribute voucher
 * POST /api/admin/vouchers/[id]/distribute
 * Accepts body with optional userIds or target payload, returns count (stubbed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const voucherId = params.id;
    if (!voucherId) {
      return errorResponse('缺少优惠券ID');
    }

    // Parse body safely (may be empty)
    const body = await request.json().catch(() => ({}));
    const userIds = Array.isArray((body as any).userIds) ? (body as any).userIds : [];

    // Stubbed logic: pretend distribution succeeded and return count
    return successResponse({ voucherId, count: userIds.length }, '优惠券已分发');
  } catch (error: any) {
    console.error('Distribute voucher error:', error);
    return errorResponse(error.message || '分发优惠券失败', 500);
  }
}
