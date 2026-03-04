import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Type } from "@sinclair/typebox";
import {
  plainAdapter,
  formatBalance,
  formatTicker,
  formatOrderbook,
  formatOrders,
  formatTrades,
  formatError,
  type FormatAdapter,
  type BalanceEntry,
  type TickerData,
  type OrderbookData,
  type OrderData,
  type TradeData,
} from "@qbtlabs/shared";

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
// JSON parsing — strip CLI log lines before JSON payload
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

// ---------------------------------------------------------------------------
// Data parsers — convert raw JSON to typed data for shared formatters
// ---------------------------------------------------------------------------

function parseBalance(raw: string): BalanceEntry[] {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return [];

  return Object.values(data as Record<string, any>)
    .filter((b: any) => b && typeof b.total === "number" && b.total > 0)
    .map((b: any) => ({
      asset: String(b.asset ?? ""),
      free: Number(b.free ?? 0),
      used: Number(b.used ?? 0),
      total: Number(b.total ?? 0),
    }));
}

function parseTicker(raw: string, exchange: string, symbol: string): TickerData | null {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return null;
  const t = data as any;
  return {
    symbol,
    exchange,
    last: Number(t.last ?? 0),
    bid: Number(t.bid ?? 0),
    ask: Number(t.ask ?? 0),
    baseVolume: t.baseVolume ? Number(t.baseVolume) : undefined,
  };
}

function parseOrderbook(raw: string): OrderbookData | null {
  const data = tryParseJson(raw);
  if (!data || typeof data !== "object") return null;
  const ob = data as any;
  return {
    symbol: ob.symbol ?? undefined,
    bids: (ob.bids ?? []).map((e: any) => ({ price: Number(e.price), amount: Number(e.amount) })),
    asks: (ob.asks ?? []).map((e: any) => ({ price: Number(e.price), amount: Number(e.amount) })),
  };
}

function parseOrders(raw: string): OrderData[] {
  const data = tryParseJson(raw);
  if (!Array.isArray(data)) return [];
  return data.map((o: any) => ({
    id: String(o.id ?? ""),
    symbol: String(o.symbol ?? ""),
    side: String(o.side ?? ""),
    type: String(o.type ?? ""),
    amount: Number(o.amount ?? 0),
    price: Number(o.price ?? 0),
    filled: o.filled ? Number(o.filled) : undefined,
    status: o.status ? String(o.status) : undefined,
  }));
}

function parseTrades(raw: string): TradeData[] {
  const data = tryParseJson(raw);
  if (!Array.isArray(data)) return [];
  return data.map((t: any) => ({
    side: String(t.side ?? ""),
    amount: Number(t.amount ?? 0),
    price: Number(t.price ?? 0),
    timestamp: t.timestamp ? Number(t.timestamp) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Adapter resolution — pick the right adapter based on platform context
// ---------------------------------------------------------------------------

/** Resolve the format adapter for the current platform. Defaults to plain. */
function getAdapter(_api: any): FormatAdapter {
  // OpenClaw exposes the platform via api.platform or context.
  // For now, default to plain — the LLM reads tool results as plain text.
  // Auto-reply commands can pass the adapter explicitly.
  return plainAdapter;
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

  const adapter = getAdapter(api);

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
      const ordersRaw = await openmm(["orders", "list", "--exchange", params.exchange, "--symbol", params.symbol]);
      const tickerRaw = await openmm(["ticker", "--exchange", params.exchange, "--symbol", params.symbol]);

      const ordersParsed = parseOrders(ordersRaw);
      const tickerParsed = parseTicker(tickerRaw, params.exchange, params.symbol);

      const parts: string[] = [];
      if (tickerParsed) parts.push(formatTicker(adapter, tickerParsed));
      parts.push(formatOrders(adapter, ordersParsed));

      return text(parts.join("\n\n"));
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
        const entries = parseBalance(result);
        return { text: formatBalance(adapter, entries, exchange) };
      } catch (err: any) {
        return { text: formatError(adapter, { message: err.message, code: "BALANCE_ERROR" }) };
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
        const ticker = parseTicker(result, exchange, symbol);
        if (!ticker) return { text: result };
        return { text: formatTicker(adapter, ticker) };
      } catch (err: any) {
        return { text: formatError(adapter, { message: err.message, code: "TICKER_ERROR" }) };
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
        const ticker = parseTicker(tickerRaw, exchange, symbol);
        const orders = parseOrders(ordersRaw);
        const tickerStr = ticker ? formatTicker(adapter, ticker) : "";
        const ordersStr = formatOrders(adapter, orders);
        return { text: `${adapter.header("Strategy Status")}\n\n${tickerStr}\n\n${ordersStr}` };
      } catch (err: any) {
        return { text: formatError(adapter, { message: err.message, code: "STRATEGY_ERROR" }) };
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
        return { text: formatOrders(adapter, parseOrders(result)) };
      } catch (err: any) {
        return { text: formatError(adapter, { message: err.message, code: "ORDERS_ERROR" }) };
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
        const ob = parseOrderbook(result);
        if (!ob) return { text: result };
        return { text: formatOrderbook(adapter, ob) };
      } catch (err: any) {
        return { text: formatError(adapter, { message: err.message, code: "ORDERBOOK_ERROR" }) };
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
        return { text: formatError(adapter, { message: err.message, code: "POOLS_ERROR" }) };
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
        return { text: formatError(adapter, { message: err.message, code: "CARDANO_ERROR" }) };
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
        return { text: formatError(adapter, { message: err.message, code: "CANCEL_ERROR" }) };
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