/**
 * 管理员更新订单预计完成时间 (ETA) API
 *
 * PATCH /api/admin/orders/[id]/eta
 * 请求体: { estimatedCompletionAt: string | null }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { updateOrderEta } from '@/server/services/admin-order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  estimatedCompletionAt: z.string().nullable(),
});

/**
 * Admin update order ETA API
 * PATCH /api/admin/orders/:id/eta
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const { estimatedCompletionAt } = parsed.data;

    // 解析日期，null 表示恢复系统计算
    let etaDate: Date | null = null;
    if (estimatedCompletionAt) {
      etaDate = new Date(estimatedCompletionAt);
      if (isNaN(etaDate.getTime())) {
        return failResponse('BAD_REQUEST', 'Invalid date format', 400);
      }
    }

    const order = await updateOrderEta(params?.id, etaDate);
    return okResponse({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
