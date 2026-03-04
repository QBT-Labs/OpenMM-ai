import type { FormatAdapter, OrderbookData } from "../types.js";
import { formatNum } from "./num.js";

export function formatOrderbook(adapter: FormatAdapter, ob: OrderbookData): string {
  const lines = [adapter.header(`${ob.symbol ?? ""} Order Book`), ""];

  if (ob.asks.length > 0) {
    lines.push(adapter.bold("Asks (sell)"));
    const topAsks = [...ob.asks].reverse().slice(0, 10);
    const askItems = topAsks.map((a) => `${formatNum(a.price)}  ${formatNum(a.amount)}`);
    lines.push(adapter.list(askItems));
    lines.push(adapter.divider());
  }

  if (ob.bids.length > 0) {
    lines.push(adapter.bold("Bids (buy)"));
    const bidItems = ob.bids.slice(0, 10).map((b) => `${formatNum(b.price)}  ${formatNum(b.amount)}`);
    lines.push(adapter.list(bidItems));
  }

  return lines.join("\n");
}
