import type { FormatAdapter, PoolDiscoveryData } from "../types.js";

/** Convert lovelace TVL to a human-readable ADA string with K/M suffix. */
function formatTvl(lovelace: number): string {
  const ada = lovelace / 1_000_000;
  if (ada >= 1_000_000) return `${(ada / 1_000_000).toFixed(1)}M ADA`;
  if (ada >= 1_000) return `${(ada / 1_000).toFixed(1)}K ADA`;
  if (ada >= 1) return `${ada.toFixed(0)} ADA`;
  return `${ada.toFixed(2)} ADA`;
}

export function formatPoolDiscovery(adapter: FormatAdapter, data: PoolDiscoveryData): string {
  const lines = [
    adapter.header(`${data.token} Liquidity Pools`),
    "",
    adapter.keyValue("Total Pools", String(data.totalPools)),
    adapter.keyValue("Total Liquidity", formatTvl(data.totalLiquidity)),
  ];

  if (data.pools.length === 0) {
    lines.push("", `${adapter.statusIcon("error")} No pools found.`);
    return lines.join("\n");
  }

  lines.push("", adapter.bold("Top Pools"));

  for (const pool of data.pools) {
    const status = pool.isActive ? adapter.statusIcon("success") : adapter.statusIcon("error");
    lines.push(`${status} ${adapter.bold(pool.dex)} — ${formatTvl(pool.tvl)}`);
  }

  if (data.recommendedIdentifiers.length > 0) {
    lines.push("", adapter.bold("Recommended for Market Making"));
    const items = data.recommendedIdentifiers.map((id, i) => {
      const pool = data.pools.find(p => p.identifier === id);
      return `${i + 1}. ${pool?.dex ?? "Unknown"} — ${formatTvl(pool?.tvl ?? 0)}`;
    });
    lines.push(adapter.list(items));
  }

  return lines.join("\n");
}
