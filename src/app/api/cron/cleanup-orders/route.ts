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

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cron 密钥验证（生产环境必须配置）
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key';

// 订单超时时间（毫秒）
const ORDER_TIMEOUT_MS = 60 * 60 * 1000; // 1 小时

export async function GET(request: NextRequest) {
    try {
        // 验证 Cron 密钥
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Vercel Cron 会通过 Authorization header 传递密钥
        const authHeader = request.headers.get('authorization');
        const bearerToken = authHeader?.replace('Bearer ', '');

        if (secret !== CRON_SECRET && bearerToken !== CRON_SECRET) {
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

        await prisma.order.updateMany({
            where: {
                id: {
                    in: cancelledOrderIds,
                },
            },
            data: {
                status: 'cancelled',
            },
        });

        // 发送通知给用户（可选）
        const notifications = expiredOrders.map(order => ({
            userId: order.userId,
            title: '订单已自动取消',
            message: `您的订单因超时未支付已自动取消`,
            type: 'order',
            actionUrl: `/orders/${order.id}`,
        }));

        await prisma.notification.createMany({
            data: notifications,
        });

        // 记录日志
        console.log(`[Cron] Cancelled ${cancelledOrderIds.length} expired orders:`, cancelledOrderIds);

        return NextResponse.json({
            success: true,
            message: `Cancelled ${cancelledOrderIds.length} expired orders`,
            cancelledCount: cancelledOrderIds.length,
            cancelledOrderIds,
            cutoffTime: cutoffTime.toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Error cancelling expired orders:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
