export function parseValidityDays(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  const value = Number(input);
  // 确保不返回 NaN，返回 null 表示无效输入
  if (Number.isNaN(value) || !Number.isFinite(value)) return null;
  return value;
}
