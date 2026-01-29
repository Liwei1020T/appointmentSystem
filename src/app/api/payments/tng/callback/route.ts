/**
 * TNG 支付回调 API Route
 *
 * 处理 Touch 'n Go 支付网关的回调通知
 * 路由: /api/payments/tng/callback
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { handleTNGCallback } from '@/services/tngPaymentService';
import type { TNGCallbackData } from '@/services/tngPaymentService';
import { failResponse, okResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { prisma } from '@/lib/prisma';

const CALLBACK_ENABLED = process.env.TNG_CALLBACK_ENABLED === 'true';
const TNG_WEBHOOK_SECRET = process.env.TNG_WEBHOOK_SECRET;

/**
 * Verify TNG webhook signature using HMAC-SHA256
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
    if (!TNG_WEBHOOK_SECRET) {
        // In development without secret configured, log warning but allow
        if (process.env.NODE_ENV === 'development') {
            console.info('[TNG Callback] WARNING: TNG_WEBHOOK_SECRET not configured, skipping signature verification');
            return true;
        }
        return false;
    }

    if (!signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', TNG_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!CALLBACK_ENABLED) {
            return failResponse('FEATURE_DISABLED', 'TNG callback is disabled', 403);
        }

        // 1. Get raw body for signature verification
        const rawBody = await request.text();

        // 2. Verify signature (security: prevent forged callbacks)
        const signature = request.headers.get('x-tng-signature');
        if (!verifySignature(rawBody, signature)) {
            console.error('[TNG Callback] Invalid signature');
            return failResponse('UNAUTHORIZED', 'Invalid signature', 401);
        }

        // 3. Parse callback data
        let callbackData: TNGCallbackData;
        try {
            callbackData = JSON.parse(rawBody);
        } catch {
            return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
        }

        // Log callback for payment audit trail
        console.info('[TNG Callback] Received:', {
            transaction_id: callbackData.transactionId,
            order_id: callbackData.orderId,
            status: callbackData.status,
            amount: callbackData.amount,
        });

        // 4. Idempotency check: prevent duplicate processing
        if (callbackData.transactionId) {
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    transactionId: callbackData.transactionId,
                    status: 'success',
                },
                select: { id: true },
            });

            if (existingPayment) {
                console.info('[TNG Callback] Already processed, skipping:', callbackData.transactionId);
                return okResponse({ message: 'Already processed' });
            }
        }

        // 5. Process callback
        await handleTNGCallback(callbackData);

        console.info('[TNG Callback] Processed successfully');

        return okResponse({ message: 'Callback processed' });
    } catch (error) {
      return handleApiError(error);
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
