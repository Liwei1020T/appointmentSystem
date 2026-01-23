/**
 * 库存智能补货建议服务
 * 基于销售数据和库存水平提供补货建议
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// 配置参数
const LOW_STOCK_THRESHOLD = 5; // 低库存阈值
const CRITICAL_STOCK_THRESHOLD = 2; // 紧急库存阈值
const SALES_ANALYSIS_DAYS = 30; // 销售分析周期（天）
const RESTOCK_BUFFER_DAYS = 14; // 补货缓冲天数

export interface RestockSuggestion {
  stringId: string;
  brand: string;
  model: string;
  currentStock: number;
  minimumStock: number;
  avgDailySales: number;
  daysUntilStockout: number | null;
  suggestedQuantity: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedCost: number;
  estimatedProfit: number;
  lastRestockDate: string | null;
}

export interface RestockSummary {
  totalItems: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalEstimatedCost: number;
  suggestions: RestockSuggestion[];
}

/**
 * 获取球线销售统计
 */
async function getStringSalesStats(days: number = SALES_ANALYSIS_DAYS) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 从订单项目中统计销售
  const salesData = await prisma.orderItem.groupBy({
    by: ['stringId'],
    where: {
      order: {
        status: { in: ['in_progress', 'completed'] },
        createdAt: { gte: startDate },
      },
    },
    _count: { stringId: true },
  });

  // 从传统单球拍订单中统计
  const legacySalesData = await prisma.order.groupBy({
    by: ['stringId'],
    where: {
      stringId: { not: null },
      status: { in: ['in_progress', 'completed'] },
      createdAt: { gte: startDate },
    },
    _count: { stringId: true },
  });

  // 合并统计
  const salesMap = new Map<string, number>();

  for (const sale of salesData) {
    salesMap.set(sale.stringId, (salesMap.get(sale.stringId) || 0) + sale._count.stringId);
  }

  for (const sale of legacySalesData) {
    if (sale.stringId) {
      salesMap.set(sale.stringId, (salesMap.get(sale.stringId) || 0) + sale._count.stringId);
    }
  }

  return salesMap;
}

/**
 * 获取最近的补货记录
 */
async function getLastRestockDates(): Promise<Map<string, Date>> {
  const restockLogs = await prisma.stockLog.findMany({
    where: { type: 'restock' },
    orderBy: { createdAt: 'desc' },
    distinct: ['stringId'],
    select: { stringId: true, createdAt: true },
  });

  const restockMap = new Map<string, Date>();
  for (const log of restockLogs) {
    restockMap.set(log.stringId, log.createdAt);
  }

  return restockMap;
}

/**
 * 计算补货优先级
 */
function calculatePriority(
  currentStock: number,
  minimumStock: number,
  daysUntilStockout: number | null
): 'critical' | 'high' | 'medium' | 'low' {
  // 库存为0或即将缺货
  if (currentStock <= 0 || (daysUntilStockout !== null && daysUntilStockout <= 3)) {
    return 'critical';
  }

  // 库存低于紧急阈值
  if (currentStock <= CRITICAL_STOCK_THRESHOLD) {
    return 'critical';
  }

  // 库存低于最低库存要求
  if (currentStock <= minimumStock) {
    return 'high';
  }

  // 预计7天内缺货
  if (daysUntilStockout !== null && daysUntilStockout <= 7) {
    return 'high';
  }

  // 库存接近最低要求
  if (currentStock <= minimumStock * 1.5) {
    return 'medium';
  }

  // 预计14天内缺货
  if (daysUntilStockout !== null && daysUntilStockout <= 14) {
    return 'medium';
  }

  return 'low';
}

/**
 * 计算建议补货数量
 */
/**
 * 计算建议补货数量
 * @param currentStock 当前库存
 * @param minimumStock 最低安全库存
 * @param avgDailySales 日均销量
 * @returns 建议补货数量
 */
export function calculateSuggestedQuantity(
  currentStock: number,
  minimumStock: number,
  avgDailySales: number
): number {
  // 目标库存 = 最低库存 + 缓冲天数的销售量
  const targetStock = minimumStock + Math.ceil(avgDailySales * RESTOCK_BUFFER_DAYS);

  // 建议补货量 = 目标库存 - 当前库存
  const suggestion = Math.max(0, targetStock - currentStock);

  // 至少补货到最低库存的2倍
  const minimumRestock = Math.max(0, minimumStock * 2 - currentStock);

  return Math.max(suggestion, minimumRestock);
}

/**
 * 生成补货建议原因
 */
function generateReason(
  currentStock: number,
  minimumStock: number,
  daysUntilStockout: number | null,
  avgDailySales: number
): string {
  const reasons: string[] = [];

  if (currentStock <= 0) {
    reasons.push('库存已清空');
  } else if (currentStock <= CRITICAL_STOCK_THRESHOLD) {
    reasons.push(`库存仅剩 ${currentStock} 件，极度紧张`);
  } else if (currentStock <= minimumStock) {
    reasons.push(`库存 ${currentStock} 件，低于安全库存 ${minimumStock} 件`);
  }

  if (daysUntilStockout !== null && daysUntilStockout <= 7) {
    reasons.push(`按当前销售速度，预计 ${Math.round(daysUntilStockout)} 天后缺货`);
  }

  if (avgDailySales > 1) {
    reasons.push(`日均销售 ${avgDailySales.toFixed(1)} 件，热销商品`);
  }

  return reasons.length > 0 ? reasons.join('；') : '建议补货以保持库存充足';
}

/**
 * 获取智能补货建议
 */
export async function getRestockSuggestions(): Promise<RestockSummary> {
  // 获取所有活跃的球线库存
  const strings = await prisma.stringInventory.findMany({
    where: { active: true },
    select: {
      id: true,
      brand: true,
      model: true,
      stock: true,
      minimumStock: true,
      costPrice: true,
      sellingPrice: true,
    },
  });

  // 获取销售统计
  const salesStats = await getStringSalesStats();

  // 获取最近补货日期
  const lastRestockDates = await getLastRestockDates();

  const suggestions: RestockSuggestion[] = [];

  for (const string of strings) {
    const totalSales = salesStats.get(string.id) || 0;
    const avgDailySales = totalSales / SALES_ANALYSIS_DAYS;

    // 计算预计缺货天数
    const daysUntilStockout =
      avgDailySales > 0 ? string.stock / avgDailySales : null;

    // 计算优先级
    const priority = calculatePriority(
      string.stock,
      string.minimumStock,
      daysUntilStockout
    );

    // 只返回需要关注的库存（非低优先级或有销售记录的）
    if (priority === 'low' && totalSales === 0) {
      continue;
    }

    // 计算建议补货量
    const suggestedQuantity = calculateSuggestedQuantity(
      string.stock,
      string.minimumStock,
      avgDailySales
    );

    // 如果不需要补货，跳过
    if (suggestedQuantity <= 0) {
      continue;
    }

    // 计算预估成本
    const costPrice = string.costPrice instanceof Decimal
      ? string.costPrice.toNumber()
      : Number(string.costPrice);
    const sellingPrice = string.sellingPrice instanceof Decimal
      ? string.sellingPrice.toNumber()
      : Number(string.sellingPrice);
    const estimatedCost = suggestedQuantity * costPrice;
    const estimatedProfit = suggestedQuantity * Math.max(0, sellingPrice - costPrice);

    // 生成原因
    const reason = generateReason(
      string.stock,
      string.minimumStock,
      daysUntilStockout,
      avgDailySales
    );

    const lastRestock = lastRestockDates.get(string.id);

    suggestions.push({
      stringId: string.id,
      brand: string.brand,
      model: string.model,
      currentStock: string.stock,
      minimumStock: string.minimumStock,
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      daysUntilStockout: daysUntilStockout !== null ? Math.round(daysUntilStockout) : null,
      suggestedQuantity,
      priority,
      reason,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      estimatedProfit: Math.round(estimatedProfit * 100) / 100,
      lastRestockDate: lastRestock ? lastRestock.toISOString() : null,
    });
  }

  // 按优先级排序
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // 同优先级按库存天数排序
    const aDays = a.daysUntilStockout ?? Infinity;
    const bDays = b.daysUntilStockout ?? Infinity;
    return aDays - bDays;
  });

  // 计算统计
  const criticalCount = suggestions.filter((s) => s.priority === 'critical').length;
  const highCount = suggestions.filter((s) => s.priority === 'high').length;
  const mediumCount = suggestions.filter((s) => s.priority === 'medium').length;
  const lowCount = suggestions.filter((s) => s.priority === 'low').length;
  const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

  return {
    totalItems: suggestions.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    suggestions,
  };
}

/**
 * 获取低库存警报（用于通知）
 */
export async function getLowStockAlerts(): Promise<{
  alerts: Array<{
    stringId: string;
    brand: string;
    model: string;
    currentStock: number;
    minimumStock: number;
    severity: 'critical' | 'warning';
  }>;
}> {
  const strings = await prisma.stringInventory.findMany({
    where: {
      active: true,
      OR: [
        { stock: { lte: CRITICAL_STOCK_THRESHOLD } },
        {
          // stock <= minimumStock
          stock: { lte: prisma.stringInventory.fields.minimumStock as any },
        },
      ],
    },
    select: {
      id: true,
      brand: true,
      model: true,
      stock: true,
      minimumStock: true,
    },
    orderBy: { stock: 'asc' },
  });

  const alerts = strings
    .filter((s) => s.stock <= s.minimumStock)
    .map((s) => ({
      stringId: s.id,
      brand: s.brand,
      model: s.model,
      currentStock: s.stock,
      minimumStock: s.minimumStock,
      severity: s.stock <= CRITICAL_STOCK_THRESHOLD ? 'critical' as const : 'warning' as const,
    }));

  return { alerts };
}
