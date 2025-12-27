/**
 * Admin Login API Route
 * POST /api/admin/auth/login
 * 管理员登录验证
 */

import { requireAdmin } from '@/lib/server-auth';
import { failResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    // Deprecated: platform migrated to phone OTP login (方案B) and removed email-based auth.
    await request.json().catch(() => null);
    return failResponse('FEATURE_DISABLED', '已切换为手机号验证码管理员登录，请使用 /admin/login', 410);
  } catch (error) {
    return handleApiError(error);
  }
}
