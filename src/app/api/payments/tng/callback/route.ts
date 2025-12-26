/**
 * TNG 支付回调 API Route
 * 
 * 处理 Touch 'n Go 支付网关的回调通知
 * 路由: /api/payments/tng/callback
 */

import { NextRequest } from 'next/server';
import { handleTNGCallback } from '@/services/tngPaymentService';
import type { TNGCallbackData } from '@/services/tngPaymentService';
import { failResponse, okResponse } from '@/lib/api-response';

const CALLBACK_ENABLED = process.env.TNG_CALLBACK_ENABLED === 'true';

export async function POST(request: NextRequest) {
    try {
        if (!CALLBACK_ENABLED) {
            return failResponse('FEATURE_DISABLED', 'TNG callback is disabled', 403);
        }

        // 1. 解析回调数据
        const callbackData: TNGCallbackData = await request.json();

        console.log('[TNG Callback] Received:', {
            transaction_id: callbackData.transactionId,
            order_id: callbackData.orderId,
            status: callbackData.status,
            amount: callbackData.amount,
        });

        // 2. 处理回调
        await handleTNGCallback(callbackData);

        console.log('[TNG Callback] Processed successfully');

        // TODO: Add signature verification + idempotency keys before enabling in production.

        // 3. 返回成功响应给 TNG
        return okResponse({ message: 'Callback processed' });
    } catch (error: any) {
        console.error('[TNG Callback] Error:', error);
        return failResponse('INTERNAL_ERROR', error.message || 'Callback failed', 500);
    }
}

// GET 方法用于健康检查
export async function GET() {
    if (!CALLBACK_ENABLED) {
        return failResponse('FEATURE_DISABLED', 'TNG callback is disabled', 403);
    }
    return okResponse({
        service: 'TNG Payment Callback',
        status: 'active',
        timestamp: new Date().toISOString(),
    });
}
