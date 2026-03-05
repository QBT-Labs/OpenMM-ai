import type { FormatAdapter, CardanoPriceData } from "../types.js";
import { formatNum } from "./num.js";

export function formatCardanoPrice(adapter: FormatAdapter, data: CardanoPriceData): string {
  const lines = [
    adapter.header(`${data.symbol} Price`),
    "",
    adapter.keyValue("ADA Price", `${formatNum(data.averagePriceAda)} ADA`),
  ];

  if (data.priceUsdt != null) {
    lines.push(adapter.keyValue("USDT Price", `$${formatNum(data.priceUsdt)}`));
  }

  if (data.confidence != null) {
    lines.push(adapter.keyValue("Confidence", `${(data.confidence * 100).toFixed(1)}%`));
  }

  if (data.sources && data.sources.length > 0) {
    lines.push(adapter.keyValue("Sources", data.sources.join(", ")));
  }

  if (data.pools.length > 1) {
    lines.push("", adapter.bold("Pool Prices"));
    for (const pool of data.pools) {
      const shortId = pool.identifier.substring(0, 12) + "...";
      lines.push(adapter.keyValue(shortId, `${formatNum(pool.priceAda)} ADA`));
    }
  }

  return lines.join("\n");
}
