import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { parseDateRangeFromSearchParams } from '@/lib/reporting';

/**
 * 管理员 - 利润分析
 *
 * GET /api/admin/reports/profit
 * Query:
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 统计口径：
 * - 订单利润：优先使用 orders.profit；若为空则用 (price - cost) 兜底（cost 为空按 0 处理）
 * - 套餐利润：目前无成本字段，按套餐支付金额作为利润（payments.packageId != null 且 status in ['success','completed']）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { start, end } = parseDateRangeFromSearchParams(request.nextUrl.searchParams, {
      defaultDays: 30,
    });

    const confirmedStatuses = ['success', 'completed'];

    const [orders, packagePayments] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'completed',
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          stringId: true,
          price: true,
          cost: true,
          profit: true,
          string: { select: { brand: true, model: true } },
        },
      }),
      prisma.payment.findMany({
        where: {
          packageId: { not: null },
          status: { in: confirmedStatuses },
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          packageId: true,
          amount: true,
          package: { select: { name: true } },
        },
      }),
    ]);

    // 订单聚合
    let orderRevenue = 0;
    let orderCost = 0;
    let orderProfit = 0;

    const profitByString = new Map<
      string,
      {
        productName: string;
        revenue: number;
        cost: number;
        profit: number;
        quantity: number;
      }
    >();

    for (const order of orders) {
      const revenue = Number(order.price ?? 0);
      const cost = Number(order.cost ?? 0);
      const profit = order.profit !== null && order.profit !== undefined ? Number(order.profit) : revenue - cost;

      orderRevenue += revenue;
      orderCost += cost;
      orderProfit += profit;

      const stringId = order.stringId || 'unknown';
      const name = order.string ? `${order.string.brand} ${order.string.model}` : 'String';
      const current = profitByString.get(stringId) ?? {
        productName: name,
        revenue: 0,
        cost: 0,
        profit: 0,
        quantity: 0,
      };
      current.revenue += revenue;
      current.cost += cost;
      current.profit += profit;
      current.quantity += 1;
      profitByString.set(stringId, current);
    }

    // 套餐聚合
    const packageRevenue = packagePayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const packageProfit = packageRevenue;

    const profitByPackage = new Map<
      string,
      {
        productName: string;
        revenue: number;
        cost: number;
        profit: number;
        quantity: number;
      }
    >();

    for (const payment of packagePayments) {
      const pid = payment.packageId || 'unknown';
      const revenue = Number(payment.amount ?? 0);
      const current = profitByPackage.get(pid) ?? {
        productName: payment.package?.name || 'Package',
        revenue: 0,
        cost: 0,
        profit: 0,
        quantity: 0,
      };
      current.revenue += revenue;
      current.profit += revenue;
      current.quantity += 1;
      profitByPackage.set(pid, current);
    }

    const totalRevenue = orderRevenue + packageRevenue;
    const totalProfit = orderProfit + packageProfit;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // 输出 profitByProduct（AdminReportsPage 使用）
    const profitByProduct = [
      ...Array.from(profitByString.values()).map((row) => ({
        productName: row.productName,
        productType: 'string',
        quantity: row.quantity,
        revenue: Number(row.revenue.toFixed(2)),
        cost: Number(row.cost.toFixed(2)),
        profit: Number(row.profit.toFixed(2)),
        margin: row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0,
      })),
      ...Array.from(profitByPackage.values()).map((row) => ({
        productName: row.productName,
        productType: 'package',
        quantity: row.quantity,
        revenue: Number(row.revenue.toFixed(2)),
        cost: 0,
        profit: Number(row.profit.toFixed(2)),
        margin: row.revenue > 0 ? 100 : 0,
      })),
    ];

    const profitByCategory = [
      {
        category: 'orders',
        profit: Number(orderProfit.toFixed(2)),
        margin: orderRevenue > 0 ? (orderProfit / orderRevenue) * 100 : 0,
      },
      {
        category: 'packages',
        profit: Number(packageProfit.toFixed(2)),
        margin: packageRevenue > 0 ? 100 : 0,
      },
    ];

    const topProfitableItems = profitByProduct
      .map((p) => ({ name: p.productName, profit: p.profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return successResponse({
      totalProfit: Number(totalProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      profitByCategory,
      profitByProduct,
      topProfitableItems,
    });
  } catch (error: any) {
    console.error('Profit report error:', error);
    return errorResponse(error.message || 'Failed to fetch profit analysis', 500);
  }
}

