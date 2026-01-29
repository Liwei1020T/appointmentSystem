/**
 * Cron API: 自动取消超时未支付订单
 *
 * 功能：
 * 1. 自动取消超过 1 小时未支付的 pending 订单
 * 2. 释放已锁定的库存
 * 3. 记录取消日志
 *
 * 调用方式：
 * - Vercel Cron: 配置 vercel.json
 * - 手动调用: GET /api/cron/cleanup-orders?secret=xxx
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Cron 密钥验证（生产环境必须配置强密钥）
const CRON_SECRET = process.env.CRON_SECRET;

// 订单超时时间（毫秒）
const ORDER_TIMEOUT_MS = 60 * 60 * 1000; // 1 小时

/**
 * Timing-safe comparison to prevent timing attacks
 */
function timingSafeSecretCompare(provided: string, expected: string): boolean {
    try {
        // Ensure both buffers have same length for timing-safe comparison
        const providedBuffer = Buffer.from(provided);
        const expectedBuffer = Buffer.from(expected);

        if (providedBuffer.length !== expectedBuffer.length) {
            // Compare with expected to prevent timing leak on length difference
            crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
            return false;
        }

        return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    try {
        // Reject weak or missing secrets in production
        if (!CRON_SECRET || CRON_SECRET === 'dev-secret-key') {
            if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
                console.error('[Cron] CRON_SECRET not configured or using weak default');
                return NextResponse.json(
                    { error: 'Server configuration error' },
                    { status: 500 }
                );
            }
            // Allow weak secret only in development
            console.info('[Cron] WARNING: Using weak CRON_SECRET in development');
        }

        // 验证 Cron 密钥
        const secret = request.nextUrl.searchParams.get('secret');

        // Vercel Cron 会通过 Authorization header 传递密钥
        const authHeader = request.headers.get('authorization');
        const bearerToken = authHeader?.replace('Bearer ', '');

        const providedSecret = secret || bearerToken || '';
        const expectedSecret = CRON_SECRET || 'dev-secret-key';

        if (!timingSafeSecretCompare(providedSecret, expectedSecret)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const cutoffTime = new Date(Date.now() - ORDER_TIMEOUT_MS);

        // 查找超时未支付的订单
        const expiredOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {
                    lt: cutoffTime,
                },
            },
            select: {
                id: true,
                userId: true,
                price: true,
                createdAt: true,
                stringId: true,
                packageUsedId: true,
                items: {
                    select: {
                        stringId: true,
                    },
                },
            },
        });

        if (expiredOrders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No expired orders to cancel',
                cancelledCount: 0,
            });
        }

        // 批量取消订单
        const cancelledOrderIds = expiredOrders.map(order => order.id);
        const packageRefundById = new Map<string, number>();
        for (const order of expiredOrders) {
            if (!order.packageUsedId) continue;
            packageRefundById.set(order.packageUsedId, (packageRefundById.get(order.packageUsedId) ?? 0) + 1);
        }

        const { restoredStockEntries, cancelledPaymentsCount, restoredVouchersCount } = await prisma.$transaction(async (tx) => {
            await tx.order.updateMany({
                where: { id: { in: cancelledOrderIds } },
                data: { status: 'cancelled' },
            });

            // Cancel pending payments for these orders.
            const cancelledPayments = await tx.payment.updateMany({
                where: { orderId: { in: cancelledOrderIds }, status: 'pending' },
                data: { status: 'cancelled' },
            });

            // Restore any vouchers that were marked used during order creation.
            const restoredVouchers = await tx.userVoucher.updateMany({
                where: { orderId: { in: cancelledOrderIds }, status: 'used' },
                data: { status: 'active', usedAt: null, orderId: null },
            });

            // Restore package remaining if legacy flows used packages while still pending.
            for (const [packageUsedId, count] of packageRefundById.entries()) {
                const currentPackage = await tx.userPackage.findUnique({
                    where: { id: packageUsedId },
                    select: { remaining: true, expiry: true },
                });

                if (!currentPackage) continue;

                const now = new Date();
                const newRemaining = currentPackage.remaining + count;
                const status = currentPackage.expiry < now ? 'expired' : newRemaining > 0 ? 'active' : 'depleted';

                await tx.userPackage.update({
                    where: { id: packageUsedId },
                    data: { remaining: { increment: count }, status },
                });
            }

            // Release reserved inventory based on stock logs tied to these orders.
            const reservedLogs = await tx.stockLog.findMany({
                where: {
                    referenceId: { in: cancelledOrderIds },
                    change: { lt: 0 },
                    type: 'sale',
                },
                select: {
                    referenceId: true,
                    stringId: true,
                    change: true,
                },
            });

            const restoreByStringId = new Map<string, number>();
            const restoreByOrderAndString = new Map<string, { orderId: string; stringId: string; amount: number }>();

            for (const log of reservedLogs) {
                if (!log.referenceId) continue;
                const amount = -Number(log.change);
                if (!Number.isFinite(amount) || amount <= 0) continue;

                restoreByStringId.set(log.stringId, (restoreByStringId.get(log.stringId) ?? 0) + amount);

                const key = `${log.referenceId}:${log.stringId}`;
                const current = restoreByOrderAndString.get(key) ?? { orderId: log.referenceId, stringId: log.stringId, amount: 0 };
                current.amount += amount;
                restoreByOrderAndString.set(key, current);
            }

            for (const [stringId, amount] of restoreByStringId.entries()) {
                await tx.stringInventory.update({
                    where: { id: stringId },
                    data: { stock: { increment: amount } },
                });
            }

            const restoreLogs = Array.from(restoreByOrderAndString.values()).map((entry) => ({
                stringId: entry.stringId,
                change: entry.amount,
                type: 'return',
                referenceId: entry.orderId,
                notes: '订单超时自动取消返还',
            }));

            if (restoreLogs.length > 0) {
                await tx.stockLog.createMany({ data: restoreLogs });
            }

            // 发送通知给用户（可选）
            const notifications = expiredOrders.map(order => ({
                userId: order.userId,
                title: '订单已自动取消',
                message: `您的订单因超时未支付已自动取消`,
                type: 'order',
                actionUrl: `/orders/${order.id}`,
            }));

            if (notifications.length > 0) {
                await tx.notification.createMany({ data: notifications });
            }

            return {
                restoredStockEntries: restoreLogs.length,
                cancelledPaymentsCount: cancelledPayments.count,
                restoredVouchersCount: restoredVouchers.count,
            };
        });

        // 记录日志
        console.info(
            `[Cron] Cancelled ${cancelledOrderIds.length} expired orders (payments cancelled: ${cancelledPaymentsCount}, vouchers restored: ${restoredVouchersCount}, stock restore logs: ${restoredStockEntries})`,
            cancelledOrderIds
        );

        return NextResponse.json({
            success: true,
            message: `Cancelled ${cancelledOrderIds.length} expired orders`,
            cancelledCount: cancelledOrderIds.length,
            cancelledOrderIds,
            cutoffTime: cutoffTime.toISOString(),
            cancelledPaymentsCount,
            restoredVouchersCount,
            restoredStockEntries,
        });
    } catch (error) {
        console.error('[Cron] Error cancelling expired orders:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
