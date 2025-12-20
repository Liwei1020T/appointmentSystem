/**
 * TNG 支付回调 API Route
 * 
 * 处理 Touch 'n Go 支付网关的回调通知
 * 路由: /api/payments/tng/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleTNGCallback } from '@/services/tngPaymentService';
import type { TNGCallbackData } from '@/services/tngPaymentService';

export async function POST(request: NextRequest) {
    try {
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

        // 3. 返回成功响应给 TNG
        return NextResponse.json(
            { success: true, message: 'Callback processed' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[TNG Callback] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// GET 方法用于健康检查
export async function GET() {
    return NextResponse.json({
        service: 'TNG Payment Callback',
        status: 'active',
        timestamp: new Date().toISOString(),
    });
}
