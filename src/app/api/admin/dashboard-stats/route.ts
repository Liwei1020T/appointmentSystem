import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const recentOrdersLimit = parseInt(searchParams.get('limit') || '5');

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Batch all database queries in a single Promise.all
        const [
            todayOrders,
            todayRevenueAgg,
            monthOrders,
            monthRevenueAgg,
            lowStockCount,
            pendingOrders,
            activePackages,
            recentOrders
        ] = await Promise.all([
            prisma.order.count({
                where: { createdAt: { gte: startOfDay } },
            }),
            prisma.order.aggregate({
                where: {
                    status: 'completed',
                    completedAt: { gte: startOfDay },
                },
                _sum: { price: true },
            }),
            prisma.order.count({
                where: { createdAt: { gte: startOfMonth } },
            }),
            prisma.order.aggregate({
                where: {
                    status: 'completed',
                    completedAt: { gte: startOfMonth },
                },
                _sum: { price: true },
            }),
            prisma.stringInventory.count({
                where: { stock: { lt: 5 } },
            }),
            prisma.order.count({
                where: { status: 'pending' },
            }),
            prisma.userPackage.count({
                where: {
                    remaining: { gt: 0 },
                    expiry: { gt: now },
                    status: 'active',
                },
            }),
            prisma.order.findMany({
                take: recentOrdersLimit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { fullName: true, email: true }
                    },
                    string: {
                        select: { brand: true, model: true }
                    }
                }
            })
        ]);

        return NextResponse.json({
            stats: {
                todayOrders,
                todayRevenue: todayRevenueAgg._sum.price || 0,
                monthOrders,
                monthRevenue: monthRevenueAgg._sum.price || 0,
                activePackages,
                lowStockItems: lowStockCount,
                pendingOrders,
            },
            recentOrders: recentOrders.map(order => ({
                id: order.id,
                user_name: order.user?.fullName || order.user?.email || '用户',
                string_name: order.string ? `${order.string.brand || ''} ${order.string.model || ''}`.trim() : '',
                total_price: Number(order.price || 0),
                status: order.status,
                created_at: order.createdAt
            }))
        });
    } catch (error) {
        console.error('Admin dashboard stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
