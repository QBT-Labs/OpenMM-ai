import type { FormatAdapter, BalanceEntry } from "../types.js";
import { formatNum } from "./num.js";

export function formatBalance(adapter: FormatAdapter, entries: BalanceEntry[], exchange: string): string {
  if (entries.length === 0) {
    return `${adapter.header(`${exchange.toUpperCase()} Balance`)}\n\nNo assets with balance found.`;
  }

  const sorted = [...entries].sort((a, b) => b.total - a.total);
  const lines = [adapter.header(`${exchange.toUpperCase()} Balance`), ""];

  for (const b of sorted) {
    const locked = b.used > 0 ? `  (locked: ${formatNum(b.used)})` : "";
    lines.push(adapter.keyValue(b.asset, `${formatNum(b.free)}${locked}`));
  }

  return lines.join("\n");
}

export function formatBalanceCompact(adapter: FormatAdapter, entries: BalanceEntry[], exchange: string): string {
  if (entries.length === 0) return "No assets with balance found.";

  const sorted = [...entries].sort((a, b) => b.total - a.total);
  const items = sorted.map((b) => `${b.asset}: ${formatNum(b.total)}`);

  return `${adapter.header(`${exchange.toUpperCase()} Balance`)}\n${adapter.list(items)}`;
}
