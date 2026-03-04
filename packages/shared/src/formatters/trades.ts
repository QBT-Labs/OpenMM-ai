import type { FormatAdapter, TradeData } from "../types.js";
import { formatNum } from "./num.js";

export function formatTrades(adapter: FormatAdapter, trades: TradeData[]): string {
  if (trades.length === 0) return "No recent trades.";

  const capped = trades.slice(0, 20);
  const header = adapter.header(`Recent Trades (${capped.length})`);
  const items = capped.map((t) => {
    const side = t.side.toUpperCase();
    const time = t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "";
    return `${side} ${formatNum(t.amount)} @ ${formatNum(t.price)}  ${time}`;
  });

  return `${header}\n${adapter.list(items)}`;
}