import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse } from '@/lib/api-response';
import { buildDayKeys, parseDateRangeFromSearchParams, toDayKey } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

/**
 * 管理员 - 导出报表（CSV）
 *
 * GET /api/admin/reports/export
 * Query:
 * - reportType: revenue | profit | sales | strings | packages | users
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 *
 * 说明：
 * - 当前 AdminReportsPage 使用 CSV 下载；因此这里直接输出 `text/csv`
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('reportType') || 'report';
    const { start, end } = parseDateRangeFromSearchParams(searchParams, { defaultDays: 30 });

    const filename = `${reportType}_report_${toDayKey(start)}_${toDayKey(end)}.csv`;

    const confirmedStatuses = ['success', 'completed'];

    const csvEscape = (value: unknown) => {
      const str = String(value ?? '');
      if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
      return str;
    };

    const toCsv = (header: string[], rows: (string | number)[][]) => {
      const lines = [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))];
      return lines.join('\n');
    };

    if (reportType === 'revenue') {
      const [payments, orders] = await Promise.all([
        prisma.payment.findMany({
          where: { status: { in: confirmedStatuses }, createdAt: { gte: start, lte: end } },
          select: { amount: true, createdAt: true },
        }),
        prisma.order.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: { createdAt: true },
        }),
      ]);

      const revenueByDay = new Map<string, number>();
      for (const p of payments) {
        const key = toDayKey(p.createdAt);
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(p.amount ?? 0));
      }
      const ordersByDay = new Map<string, number>();
      for (const o of orders) {
        const key = toDayKey(o.createdAt);
        ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
      }

      const rows = buildDayKeys(start, end).map((date) => [
        date,
        Number((revenueByDay.get(date) ?? 0).toFixed(2)),
        ordersByDay.get(date) ?? 0,
      ]);

      const csv = toCsv(['date', 'revenue', 'orders'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (reportType === 'sales') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, status: true, price: true },
      });
      const completed = orders.filter((o) => o.status === 'completed');

      const byDay = new Map<string, { sales: number; orders: number }>();
      for (const o of completed) {
        const key = toDayKey(o.createdAt);
        const current = byDay.get(key) ?? { sales: 0, orders: 0 };
        current.sales += Number(o.price ?? 0);
        current.orders += 1;
        byDay.set(key, current);
      }

      const rows = buildDayKeys(start, end).map((date) => {
        const v = byDay.get(date) ?? { sales: 0, orders: 0 };
        return [date, Number(v.sales.toFixed(2)), v.orders];
      });

      const csv = toCsv(['date', 'sales', 'completed_orders'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (reportType === 'strings') {
      const orders = await prisma.order.findMany({
        where: {
          status: 'completed',
          stringId: { not: null },
          createdAt: { gte: start, lte: end },
        },
        select: {
          stringId: true,
          price: true,
          tension: true,
          string: { select: { brand: true, model: true } },
        },
      });

      const acc = new Map<
        string,
        { name: string; quantity: number; revenue: number; tensionSum: number; tensionCount: number }
      >();
      for (const o of orders) {
        const sid = o.stringId as string;
        const name = o.string ? `${o.string.brand} ${o.string.model}` : 'String';
        const current = acc.get(sid) ?? {
          name,
          quantity: 0,
          revenue: 0,
          tensionSum: 0,
          tensionCount: 0,
        };
        current.quantity += 1;
        current.revenue += Number(o.price ?? 0);
        if (o.tension !== null && o.tension !== undefined) {
          current.tensionSum += Number(o.tension);
          current.tensionCount += 1;
        }
        acc.set(sid, current);
      }

      const rows = Array.from(acc.entries())
        .map(([id, v]) => [
          id,
          v.name,
          v.quantity,
          Number(v.revenue.toFixed(2)),
          v.tensionCount > 0 ? Number((v.tensionSum / v.tensionCount).toFixed(1)) : 0,
        ])
        .sort((a, b) => Number(b[2]) - Number(a[2]));

      const csv = toCsv(['string_id', 'name', 'quantity', 'revenue', 'avg_tension'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (reportType === 'packages') {
      const payments = await prisma.payment.findMany({
        where: {
          packageId: { not: null },
          status: { in: confirmedStatuses },
          createdAt: { gte: start, lte: end },
        },
        select: {
          packageId: true,
          amount: true,
          package: { select: { name: true } },
        },
      });

      const acc = new Map<string, { name: string; sold: number; revenue: number }>();
      for (const p of payments) {
        const pid = p.packageId as string;
        const name = p.package?.name || 'Package';
        const current = acc.get(pid) ?? { name, sold: 0, revenue: 0 };
        current.sold += 1;
        current.revenue += Number(p.amount ?? 0);
        acc.set(pid, current);
      }

      const rows = Array.from(acc.entries())
        .map(([id, v]) => [id, v.name, v.sold, Number(v.revenue.toFixed(2))])
        .sort((a, b) => Number(b[2]) - Number(a[2]));

      const csv = toCsv(['package_id', 'name', 'sold', 'revenue'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (reportType === 'profit') {
      const orders = await prisma.order.findMany({
        where: {
          status: 'completed',
          createdAt: { gte: start, lte: end },
        },
        select: {
          price: true,
          cost: true,
          profit: true,
          string: { select: { brand: true, model: true } },
        },
      });

      const rows = orders.map((o) => {
        const revenue = Number(o.price ?? 0);
        const cost = Number(o.cost ?? 0);
        const profit = o.profit !== null && o.profit !== undefined ? Number(o.profit) : revenue - cost;
        const name = o.string ? `${o.string.brand} ${o.string.model}` : 'String';
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return [name, 'string', 1, Number(revenue.toFixed(2)), Number(cost.toFixed(2)), Number(profit.toFixed(2)), Number(margin.toFixed(1))];
      });

      const csv = toCsv(['product', 'type', 'qty', 'revenue', 'cost', 'profit', 'margin'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (reportType === 'users') {
      const users = await prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, referredBy: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay = new Map<string, number>();
      for (const u of users) {
        const key = toDayKey(u.createdAt);
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      }
      let cumulative = Math.max((await prisma.user.count()) - users.length, 0);
      const rows = buildDayKeys(start, end).map((date) => {
        const inc = byDay.get(date) ?? 0;
        cumulative += inc;
        return [date, inc, cumulative];
      });

      const csv = toCsv(['date', 'new_users', 'cumulative_users'], rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // 默认兜底：返回一个空 CSV
    const csv = 'type\nunknown';
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export report error:', error);
    return errorResponse(error.message || 'Failed to export report', 500);
  }
}
