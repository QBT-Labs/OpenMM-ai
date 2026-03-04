/** Format a numeric value for display with smart precision. */
export function formatNum(val: unknown): string {
  if (val == null) return "-";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  // Small numbers — show up to 8 significant digits
  return n.toPrecision(Math.min(8, Math.max(2, -Math.floor(Math.log10(Math.abs(n))) + 4)));
}
