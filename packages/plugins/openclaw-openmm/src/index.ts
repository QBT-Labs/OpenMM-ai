import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Type } from "@sinclair/typebox";

const exec = promisify(execFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map plugin config keys to environment variables for the CLI. */
function configToEnv(config: Record<string, unknown>): Record<string, string> {
  const map: Record<string, string> = {
    mexcApiKey: "MEXC_API_KEY",
    mexcSecret: "MEXC_SECRET",
    mexcUid: "MEXC_UID",
    gateioApiKey: "GATEIO_API_KEY",
    gateioSecret: "GATEIO_SECRET",
    krakenApiKey: "KRAKEN_API_KEY",
    krakenSecret: "KRAKEN_SECRET",
    bitgetApiKey: "BITGET_API_KEY",
    bitgetSecret: "BITGET_SECRET",
    bitgetPassphrase: "BITGET_PASSPHRASE",
  };
  const env: Record<string, string> = {};
  for (const [key, envVar] of Object.entries(map)) {
    const val = config[key];
    if (typeof val === "string" && val.length > 0) {
      env[envVar] = val;
    }
  }
  return env;
}

/** Wrap a string result for the agent. */
function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

// ---------------------------------------------------------------------------
// Formatting helpers — turn raw JSON into readable Telegram messages
// ---------------------------------------------------------------------------

/** Extract and parse JSON from CLI output that may contain log lines. */
function tryParseJson(raw: string): unknown | null {
  // Try direct parse first (fast path)
  try {
    return JSON.parse(raw);
  } catch {
    // CLI may prefix JSON with log/info lines — find the first { or [
    const objStart = raw.indexOf("{");
    const arrStart = raw.indexOf("[");
    let start = -1;
    if (objStart >= 0 && arrStart >= 0) start = Math.min(objStart, arrStart);
    else if (objStart >= 0) start = objStart;
    else if (arrStart >= 0) start = arrStart;

    if (start > 0) {
      try {
        return JSON.parse(raw.slice(start));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function formatBalance(raw: string, exchange: string): string {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return raw;

  const entries = Object.values(data as Record<string, any>).filter(
    (b: any) => b && typeof b.total === "number" && b.total > 0,
  );
  if (entries.length === 0) return `${exchange.toUpperCase()} Balance\n\nNo assets with balance found.`;

  const lines = entries
    .sort((a: any, b: any) => b.total - a.total)
    .map((b: any) => {
      const free = Number(b.free ?? 0);
      const used = Number(b.used ?? 0);
      const parts = [`  ${String(b.asset).padEnd(8)} ${formatNum(free)}`];
      if (used > 0) parts[0] += `  (locked: ${formatNum(used)})`;
      return parts[0];
    });

  return `${exchange.toUpperCase()} Balance\n\n${lines.join("\n")}`;
}

function formatTicker(raw: string, exchange: string, symbol: string): string {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return raw;

  const t = data as any;
  const spread = t.ask && t.bid ? ((t.ask - t.bid) / t.bid) * 100 : null;

  const lines = [
    `${symbol} on ${exchange.toUpperCase()}`,
    "",
    `  Price     ${formatNum(t.last)}`,
    `  Bid       ${formatNum(t.bid)}`,
    `  Ask       ${formatNum(t.ask)}`,
  ];
  if (spread !== null) lines.push(`  Spread    ${spread.toFixed(3)}%`);
  if (t.baseVolume) lines.push(`  Vol 24h   ${formatNum(t.baseVolume)}`);

  return lines.join("\n");
}

function formatOrderbook(raw: string): string {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return raw;

  const ob = data as any;
  const bids: any[] = ob.bids ?? [];
  const asks: any[] = ob.asks ?? [];

  const fmtLevel = (e: any) => `  ${formatNum(e.price).padStart(14)}  ${formatNum(e.amount)}`;

  const lines = [`${ob.symbol ?? ""} Order Book`, ""];
  if (asks.length > 0) {
    lines.push("  Asks (sell)");
    for (const a of [...asks].reverse().slice(0, 10)) lines.push(fmtLevel(a));
    lines.push("  ──────────────────────");
  }
  if (bids.length > 0) {
    lines.push("  Bids (buy)");
    for (const b of bids.slice(0, 10)) lines.push(fmtLevel(b));
  }

  return lines.join("\n");
}

function formatOrders(raw: string): string {
  const data = tryParseJson(raw);
  if (!Array.isArray(data)) return raw;
  if (data.length === 0) return "No open orders.";

  const lines = [`Open Orders (${data.length})`, ""];
  for (const o of data) {
    const side = (o.side ?? "").toUpperCase();
    const filled = o.filled ? ` filled: ${formatNum(o.filled)}` : "";
    lines.push(`  ${side} ${formatNum(o.amount)} ${o.symbol} @ ${formatNum(o.price)}${filled}`);
    lines.push(`  ID: ${o.id}  Status: ${o.status ?? "open"}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function formatTrades(raw: string): string {
  const data = tryParseJson(raw);
  if (!Array.isArray(data)) return raw;
  if (data.length === 0) return "No recent trades.";

  const lines = [`Recent Trades (${data.length})`, ""];
  for (const t of data.slice(0, 20)) {
    const side = (t.side ?? "").toUpperCase();
    const time = t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "";
    lines.push(`  ${side.padEnd(4)} ${formatNum(t.amount)} @ ${formatNum(t.price)}  ${time}`);
  }

  return lines.join("\n");
}

function formatNum(val: unknown): string {
  if (val == null) return "-";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  // Small numbers — show up to 8 significant digits
  return n.toPrecision(Math.min(8, Math.max(2, -Math.floor(Math.log10(Math.abs(n))) + 4)));
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

export default function register(api: any) {
  const pluginConfig: Record<string, unknown> = api.pluginConfig ?? {};
  const credentialEnv = configToEnv(pluginConfig);

  /** Run an openmm CLI command with plugin credentials injected. */
  async function openmm(args: string[]): Promise<string> {
    const { stdout } = await exec("openmm", args, {
      env: { ...process.env, ...credentialEnv },
    });
    return stdout.trim();
  }
  // ------------------------------------------------------------------
  // Agent tools — invoked by the LLM during conversation
  // ------------------------------------------------------------------

  // Balance
  api.registerTool({
    name: "openmm_balance",
    description:
      "Get account balances for a supported exchange. Returns all assets or a specific one.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id: mexc, gateio, kraken, bitget" }),
      asset: Type.Optional(Type.String({ description: "Filter by asset symbol, e.g. BTC, USDT" })),
    }),
    async execute(_id: string, params: { exchange: string; asset?: string }) {
      const args = ["balance", "--exchange", params.exchange, "--json"];
      if (params.asset) args.push("--asset", params.asset);
      return text(await openmm(args));
    },
  });

  // Ticker
  api.registerTool({
    name: "openmm_ticker",
    description: "Get the current price, bid/ask, spread, and 24h volume for a trading pair.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id" }),
      symbol: Type.String({ description: "Trading pair in BASE/QUOTE format, e.g. BTC/USDT" }),
    }),
    async execute(_id: string, params: { exchange: string; symbol: string }) {
      return text(await openmm(["ticker", "--exchange", params.exchange, "--symbol", params.symbol]));
    },
  });

  // Order book
  api.registerTool({
    name: "openmm_orderbook",
    description: "Get the order book (bids and asks) for a trading pair.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id" }),
      symbol: Type.String({ description: "Trading pair, e.g. ADA/EUR" }),
      limit: Type.Optional(Type.Number({ description: "Number of levels to return (default 10)" })),
    }),
    async execute(_id: string, params: { exchange: string; symbol: string; limit?: number }) {
      const args = ["orderbook", "--exchange", params.exchange, "--symbol", params.symbol];
      if (params.limit) args.push("--limit", String(params.limit));
      return text(await openmm(args));
    },
  });

  // Recent trades
  api.registerTool({
    name: "openmm_trades",
    description: "Get recent trades for a trading pair with buy/sell breakdown.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id" }),
      symbol: Type.String({ description: "Trading pair" }),
      limit: Type.Optional(Type.Number({ description: "Number of trades to return (default 50)" })),
    }),
    async execute(_id: string, params: { exchange: string; symbol: string; limit?: number }) {
      const args = ["trades", "--exchange", params.exchange, "--symbol", params.symbol];
      if (params.limit) args.push("--limit", String(params.limit));
      return text(await openmm(args));
    },
  });

  // List orders
  api.registerTool({
    name: "openmm_list_orders",
    description: "List open orders on an exchange, optionally filtered by trading pair.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id" }),
      symbol: Type.Optional(Type.String({ description: "Filter by trading pair" })),
      limit: Type.Optional(Type.Number({ description: "Max orders to return" })),
    }),
    async execute(_id: string, params: { exchange: string; symbol?: string; limit?: number }) {
      const args = ["orders", "list", "--exchange", params.exchange];
      if (params.symbol) args.push("--symbol", params.symbol);
      if (params.limit) args.push("--limit", String(params.limit));
      return text(await openmm(args));
    },
  });

  // Create order (optional — requires explicit approval)
  api.registerTool(
    {
      name: "openmm_create_order",
      description:
        "Place a limit or market order. IMPORTANT: Always confirm with the user before executing.",
      parameters: Type.Object({
        exchange: Type.String({ description: "Exchange id" }),
        symbol: Type.String({ description: "Trading pair, e.g. SNEK/USDT" }),
        side: Type.String({ description: "buy or sell" }),
        type: Type.String({ description: "limit or market" }),
        amount: Type.Number({ description: "Order amount in base currency" }),
        price: Type.Optional(Type.Number({ description: "Limit price (required for limit orders)" })),
      }),
      async execute(
        _id: string,
        params: { exchange: string; symbol: string; side: string; type: string; amount: number; price?: number },
      ) {
        const args = [
          "orders", "create",
          "--exchange", params.exchange,
          "--symbol", params.symbol,
          "--side", params.side,
          "--type", params.type,
          "--amount", String(params.amount),
        ];
        if (params.price != null) args.push("--price", String(params.price));
        return text(await openmm(args));
      },
    },
    { optional: true },
  );

  // Cancel order (optional)
  api.registerTool(
    {
      name: "openmm_cancel_order",
      description: "Cancel a specific order by ID.",
      parameters: Type.Object({
        exchange: Type.String({ description: "Exchange id" }),
        orderId: Type.String({ description: "Order ID to cancel" }),
        symbol: Type.String({ description: "Trading pair the order belongs to" }),
      }),
      async execute(_id: string, params: { exchange: string; orderId: string; symbol: string }) {
        return text(
          await openmm(["orders", "cancel", "--exchange", params.exchange, "--id", params.orderId, "--symbol", params.symbol]),
        );
      },
    },
    { optional: true },
  );

  // Cancel all orders (optional)
  api.registerTool(
    {
      name: "openmm_cancel_all_orders",
      description: "Cancel all open orders for a trading pair on an exchange.",
      parameters: Type.Object({
        exchange: Type.String({ description: "Exchange id" }),
        symbol: Type.Optional(Type.String({ description: "Trading pair (cancels all if omitted)" })),
      }),
      async execute(_id: string, params: { exchange: string; symbol?: string }) {
        const args = ["orders", "cancel-all", "--exchange", params.exchange];
        if (params.symbol) args.push("--symbol", params.symbol);
        return text(await openmm(args));
      },
    },
    { optional: true },
  );

  // Start grid strategy (optional)
  api.registerTool(
    {
      name: "openmm_grid_start",
      description:
        "Start an automated grid trading strategy. Runs a dry-run by default. Always show the plan to the user first.",
      parameters: Type.Object({
        exchange: Type.String({ description: "Exchange id" }),
        symbol: Type.String({ description: "Trading pair" }),
        levels: Type.Optional(Type.Number({ description: "Grid levels per side (max 10, default 5)" })),
        spacing: Type.Optional(Type.Number({ description: "Base spacing between levels as decimal (0.02 = 2%)" })),
        size: Type.Optional(Type.Number({ description: "Base order size in quote currency (default 50)" })),
        spacingModel: Type.Optional(Type.String({ description: "linear, geometric, or custom" })),
        sizeModel: Type.Optional(Type.String({ description: "flat, pyramidal, or custom" })),
        dryRun: Type.Optional(Type.Boolean({ description: "Simulate without placing real orders (default true)" })),
      }),
      async execute(
        _id: string,
        params: {
          exchange: string;
          symbol: string;
          levels?: number;
          spacing?: number;
          size?: number;
          spacingModel?: string;
          sizeModel?: string;
          dryRun?: boolean;
        },
      ) {
        const args = ["trade", "--strategy", "grid", "--exchange", params.exchange, "--symbol", params.symbol];
        if (params.levels) args.push("--levels", String(params.levels));
        if (params.spacing) args.push("--spacing", String(params.spacing));
        if (params.size) args.push("--size", String(params.size));
        if (params.spacingModel) args.push("--spacing-model", params.spacingModel);
        if (params.sizeModel) args.push("--size-model", params.sizeModel);
        if (params.dryRun !== false) args.push("--dry-run");
        return text(await openmm(args));
      },
    },
    { optional: true },
  );

  // Stop grid strategy (optional) — cancels all open orders for the pair
  api.registerTool(
    {
      name: "openmm_grid_stop",
      description: "Stop a running grid strategy by cancelling all open orders for the trading pair.",
      parameters: Type.Object({
        exchange: Type.String({ description: "Exchange id" }),
        symbol: Type.String({ description: "Trading pair" }),
      }),
      async execute(_id: string, params: { exchange: string; symbol: string }) {
        return text(
          await openmm(["orders", "cancel-all", "--exchange", params.exchange, "--symbol", params.symbol]),
        );
      },
    },
    { optional: true },
  );

  // Grid strategy status — shows open orders and current price for the pair
  api.registerTool({
    name: "openmm_grid_status",
    description: "Get the current status of a grid strategy by listing open orders and the current price for the pair.",
    parameters: Type.Object({
      exchange: Type.String({ description: "Exchange id" }),
      symbol: Type.String({ description: "Trading pair" }),
    }),
    async execute(_id: string, params: { exchange: string; symbol: string }) {
      const orders = await openmm(["orders", "list", "--exchange", params.exchange, "--symbol", params.symbol]);
      const ticker = await openmm(["ticker", "--exchange", params.exchange, "--symbol", params.symbol]);
      return text(`Open Orders:\n${orders}\n\nCurrent Price:\n${ticker}`);
    },
  });

  // Cardano DEX price
  api.registerTool({
    name: "openmm_cardano_price",
    description:
      "Get the aggregated Cardano token price from DEX pools. Calculates TOKEN/USDT via TOKEN/ADA × ADA/USDT.",
    parameters: Type.Object({
      symbol: Type.String({ description: "Cardano token symbol, e.g. SNEK, INDY, NIGHT" }),
    }),
    async execute(_id: string, params: { symbol: string }) {
      return text(await openmm(["pool-discovery", "prices", params.symbol]));
    },
  });

  // Discover Cardano pools
  api.registerTool({
    name: "openmm_discover_pools",
    description: "Discover Cardano DEX liquidity pools for a token via Iris Protocol.",
    parameters: Type.Object({
      symbol: Type.String({ description: "Cardano token symbol" }),
      minLiquidity: Type.Optional(Type.Number({ description: "Minimum TVL in ADA to filter pools" })),
    }),
    async execute(_id: string, params: { symbol: string; minLiquidity?: number }) {
      const args = ["pool-discovery", "discover", params.symbol];
      if (params.minLiquidity) args.push("--min-liquidity", String(params.minLiquidity));
      return text(await openmm(args));
    },
  });

  // ------------------------------------------------------------------
  // Auto-reply commands — execute without AI invocation
  // ------------------------------------------------------------------

  api.registerCommand({
    name: "balance",
    description: "Quick balance check. Usage: /balance [exchange]",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const exchange = ctx.args?.trim() || "mexc";
      try {
        const result = await openmm(["balance", "--exchange", exchange, "--json"]);
        return { text: formatBalance(result, exchange) };
      } catch (err: any) {
        return { text: `Error checking balance: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "price",
    description: "Quick price check. Usage: /price <exchange> <symbol>",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const parts = ctx.args?.trim().split(/\s+/) || [];
      if (parts.length < 2) {
        return { text: "Usage: /price <exchange> <symbol>\nExample: /price mexc BTC/USDT" };
      }
      const [exchange, symbol] = parts;
      try {
        const result = await openmm(["ticker", "--exchange", exchange, "--symbol", symbol, "--json"]);
        return { text: formatTicker(result, exchange, symbol) };
      } catch (err: any) {
        return { text: `Error fetching price: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "strategy",
    description: "Show active grid strategy status. Usage: /strategy <exchange> <symbol>",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const parts = ctx.args?.trim().split(/\s+/) || [];
      if (parts.length < 2) {
        return { text: "Usage: /strategy <exchange> <symbol>\nExample: /strategy mexc SNEK/USDT" };
      }
      const [exchange, symbol] = parts;
      try {
        const ordersRaw = await openmm(["orders", "list", "--exchange", exchange, "--symbol", symbol, "--json"]);
        const tickerRaw = await openmm(["ticker", "--exchange", exchange, "--symbol", symbol, "--json"]);
        const ordersFormatted = formatOrders(ordersRaw);
        const tickerFormatted = formatTicker(tickerRaw, exchange, symbol);
        return { text: `Strategy Status\n\n${tickerFormatted}\n\n${ordersFormatted}` };
      } catch (err: any) {
        return { text: `Error fetching strategy status: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "orders",
    description: "List open orders. Usage: /orders [exchange]",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const exchange = ctx.args?.trim() || "mexc";
      try {
        const result = await openmm(["orders", "list", "--exchange", exchange, "--json"]);
        return { text: formatOrders(result) };
      } catch (err: any) {
        return { text: `Error listing orders: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "orderbook",
    description: "Quick order book view. Usage: /orderbook <exchange> <symbol>",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const parts = ctx.args?.trim().split(/\s+/) || [];
      if (parts.length < 2) {
        return { text: "Usage: /orderbook <exchange> <symbol>\nExample: /orderbook kraken ADA/EUR" };
      }
      const [exchange, symbol] = parts;
      try {
        const result = await openmm(["orderbook", "--exchange", exchange, "--symbol", symbol, "--limit", "10", "--json"]);
        return { text: formatOrderbook(result) };
      } catch (err: any) {
        return { text: `Error fetching orderbook: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "pools",
    description: "Discover Cardano DEX pools. Usage: /pools <token>",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const token = ctx.args?.trim();
      if (!token) {
        return { text: "Usage: /pools <token>\nExample: /pools SNEK" };
      }
      try {
        const result = await openmm(["pool-discovery", "discover", token]);
        return { text: result };
      } catch (err: any) {
        return { text: `Error discovering pools: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "cardano",
    description: "Cardano token DEX price. Usage: /cardano <token>",
    acceptsArgs: true,
    handler: async (ctx: { args?: string }) => {
      const token = ctx.args?.trim();
      if (!token) {
        return { text: "Usage: /cardano <token>\nExample: /cardano INDY" };
      }
      try {
        const result = await openmm(["pool-discovery", "prices", token]);
        return { text: result };
      } catch (err: any) {
        return { text: `Error fetching Cardano price: ${err.message}` };
      }
    },
  });

  api.registerCommand({
    name: "cancelall",
    description: "Cancel all open orders. Usage: /cancelall <exchange> [symbol]",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const parts = ctx.args?.trim().split(/\s+/) || [];
      if (parts.length < 1 || !parts[0]) {
        return { text: "Usage: /cancelall <exchange> [symbol]\nExample: /cancelall mexc SNEK/USDT" };
      }
      const [exchange, symbol] = parts;
      try {
        const args = ["orders", "cancel-all", "--exchange", exchange];
        if (symbol) args.push("--symbol", symbol);
        const result = await openmm(args);
        return { text: result };
      } catch (err: any) {
        return { text: `Error cancelling orders: ${err.message}` };
      }
    },
  });

  // ------------------------------------------------------------------
  // Background service — strategy monitoring
  // ------------------------------------------------------------------

  api.registerService({
    id: "openmm-strategy-monitor",
    start: () => {
      api.logger.info("[openmm] Strategy monitor ready. Active strategies will be tracked.");
    },
    stop: () => {
      api.logger.info("[openmm] Strategy monitor stopped.");
    },
  });
}
