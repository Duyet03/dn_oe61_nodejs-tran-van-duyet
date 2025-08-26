export function toPositiveInt(value: unknown, defaultValue = 1): number {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  return defaultValue;
}


