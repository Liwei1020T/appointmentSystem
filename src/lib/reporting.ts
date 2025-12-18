/**
 * Reporting helpers (Admin analytics)
 *
 * 目标：
 * - 统一处理 date range（startDate/endDate 或 days）
 * - 提供稳定的按天 key（YYYY-MM-DD）与日期序列
 *
 * 注意：
 * - API 入参一般是 `YYYY-MM-DD`（来自 `<input type="date" />`），按本地时区解释
 * - 返回数据中日期 key 使用 `YYYY-MM-DD`，便于前端图表展示
 */

export interface DateRangeOptions {
  defaultDays?: number;
}

export interface ParsedDateRange {
  start: Date;
  end: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 解析 `YYYY-MM-DD` 到 Date（本地时区）
 */
function parseDateInput(value: string): Date | null {
  if (!value) return null;
  // 通过本地时区构造，避免 new Date('YYYY-MM-DD') 在不同环境被当成 UTC 的歧义
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * 从 searchParams 中解析 start/end（或 days），并返回 [startOfDay, endOfDay] 的 DateRange
 */
export function parseDateRangeFromSearchParams(
  searchParams: URLSearchParams,
  options: DateRangeOptions = {}
): ParsedDateRange {
  const defaultDays = options.defaultDays ?? 30;
  const startDateParam = searchParams.get('startDate') || '';
  const endDateParam = searchParams.get('endDate') || '';
  const daysParam = searchParams.get('days') || '';

  const endDate =
    parseDateInput(endDateParam) ??
    new Date(); // 默认今天

  if (daysParam) {
    const days = Math.max(1, Number(daysParam) || defaultDays);
    const start = new Date(endDate.getTime() - (days - 1) * MS_PER_DAY);
    return { start: toStartOfDay(start), end: toEndOfDay(endDate) };
  }

  const startDate =
    parseDateInput(startDateParam) ??
    new Date(endDate.getTime() - (defaultDays - 1) * MS_PER_DAY);

  return { start: toStartOfDay(startDate), end: toEndOfDay(endDate) };
}

/**
 * 将 Date 转成按天的稳定 key（YYYY-MM-DD）
 */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 生成 [start, end]（按天，含头含尾）的日期 key 序列
 */
export function buildDayKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = toStartOfDay(start);
  const endDay = toStartOfDay(end);

  while (cursor.getTime() <= endDay.getTime()) {
    keys.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}
