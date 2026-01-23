export function parseValidityDays(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  return Number(input);
}
