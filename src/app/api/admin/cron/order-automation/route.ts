/**
 * 订单自动化任务 API
 * POST /api/admin/cron/order-automation - 运行订单自动化任务
 * GET /api/admin/cron/order-automation - 获取自动化统计
 *
 * 此端点应通过 cron job 定期调用（建议每小时一次）
 * 可以使用 Vercel Cron Jobs、外部 cron 服务或云函数调度
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import {
  runOrderAutomation,
  getOrderAutomationStats,
} from '@/server/services/order-automation.service';

// 可选的 cron 密钥验证（用于无需登录的定时任务）
const CRON_SECRET = process.env.CRON_SECRET;

async function verifyCronOrAdmin(request: NextRequest): Promise<boolean> {
  // 检查 cron 密钥
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  // 检查管理员登录
  const session = await auth();
  if (session?.user?.role === 'admin') {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await verifyCronOrAdmin(request);
    if (!authorized) {
      return errorResponse('Unauthorized', 401);
    }

    const result = await runOrderAutomation();

    console.log('[Order Automation] Run completed:', result);

    return successResponse({
      message: 'Order automation completed',
      results: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await verifyCronOrAdmin(request);
    if (!authorized) {
      return errorResponse('Unauthorized', 401);
    }

    const stats = await getOrderAutomationStats();

    return successResponse({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
