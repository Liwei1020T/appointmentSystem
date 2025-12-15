import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalOrders, totalUsers, totalRevenue, lowStockCount, pendingOrders] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { price: true }, where: { status: 'completed' } }),
      prisma.stringInventory.count({ where: { stock: { lt: 5 } } }),
      prisma.order.count({ where: { status: 'pending' } }),
    ]);
    
    return NextResponse.json({
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.price || 0,
      lowStockCount,
      pendingOrders,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
