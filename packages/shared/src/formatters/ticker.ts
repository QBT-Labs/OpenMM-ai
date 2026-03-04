import type { FormatAdapter, TickerData } from "../types.js";
import { formatNum } from "./num.js";

export function formatTicker(adapter: FormatAdapter, ticker: TickerData): string {
  const spread = ticker.ask && ticker.bid ? ((ticker.ask - ticker.bid) / ticker.bid) * 100 : null;

  const lines = [
    adapter.header(`${ticker.symbol} on ${ticker.exchange.toUpperCase()}`),
    "",
    adapter.keyValue("Price", formatNum(ticker.last)),
    adapter.keyValue("Bid", formatNum(ticker.bid)),
    adapter.keyValue("Ask", formatNum(ticker.ask)),
  ];

  if (spread !== null) {
    lines.push(adapter.keyValue("Spread", `${spread.toFixed(3)}%`));
  }

  if (ticker.baseVolume) {
    lines.push(adapter.keyValue("Vol 24h", formatNum(ticker.baseVolume)));
  }

  return lines.join("\n");
}
