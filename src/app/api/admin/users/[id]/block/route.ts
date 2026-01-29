/**
 * Admin - Block/unblock user (placeholder)
 * PUT /api/admin/users/[id]/block
 *
 * Note: current DB schema does not have `is_blocked` / `blocked_reason`.
 * This endpoint returns a clear error instead of 404 to avoid "not valid JSON" in the UI.
 */

import { requireAdmin } from '@/lib/server-auth';
import { errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function PUT() {
  try {
    await requireAdmin();
    return errorResponse('当前版本未实现封禁功能（缺少 is_blocked 字段）', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
