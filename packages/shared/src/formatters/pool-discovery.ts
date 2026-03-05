import type { FormatAdapter, PoolDiscoveryData } from "../types.js";
import { formatNum } from "./num.js";

export function formatPoolDiscovery(adapter: FormatAdapter, data: PoolDiscoveryData): string {
  const lines = [
    adapter.header(`${data.token} Liquidity Pools`),
    "",
    adapter.keyValue("Total Pools", String(data.totalPools)),
    adapter.keyValue("Total Liquidity", `$${formatNum(data.totalLiquidity)}`),
  ];

  if (data.pools.length === 0) {
    lines.push("", `${adapter.statusIcon("error")} No pools found.`);
    return lines.join("\n");
  }

  lines.push("", adapter.bold("Top Pools"));

  for (const pool of data.pools) {
    const status = pool.isActive ? adapter.statusIcon("success") : adapter.statusIcon("error");
    lines.push(`${status} ${adapter.bold(pool.dex)} — TVL $${formatNum(pool.tvl)}`);
  }

  if (data.recommendedIdentifiers.length > 0) {
    lines.push("", adapter.bold("Recommended for Market Making"));
    const items = data.recommendedIdentifiers.map((id, i) => {
      const pool = data.pools.find(p => p.identifier === id);
      return `${i + 1}. ${pool?.dex ?? "Unknown"} — $${formatNum(pool?.tvl ?? 0)}`;
    });
    lines.push(adapter.list(items));
  }

  return lines.join("\n");
}
