export interface FormatAdapter {
  bold(text: string): string;
  italic(text: string): string;
  code(text: string): string;
  codeBlock(text: string): string;
  link(text: string, url: string): string;
  header(text: string, level?: number): string;
  divider(): string;
  statusIcon(status: "success" | "warning" | "error" | "info"): string;
  list(items: string[]): string;
  keyValue(key: string, value: string): string;
}

export interface BalanceEntry {
  asset: string;
  free: number;
  used: number;
  total: number;
}

export interface TickerData {
  symbol: string;
  exchange: string;
  last: number;
  bid: number;
  ask: number;
  baseVolume?: number;
}

export interface OrderbookLevel {
  price: number;
  amount: number;
}

export interface OrderbookData {
  symbol?: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface OrderData {
  id: string;
  symbol: string;
  side: string;
  type: string;
  amount: number;
  price: number;
  filled?: number;
  status?: string;
}

export interface TradeData {
  side: string;
  amount: number;
  price: number;
  timestamp?: number;
}

export interface ErrorData {
  message: string;
  code?: string;
  details?: string;
}

export interface CardanoPriceData {
  symbol: string;
  pools: { identifier: string; priceAda: number }[];
  averagePriceAda: number;
  priceUsdt?: number;
  confidence?: number;
  sources?: string[];
  timestamp?: string;
}

export interface PoolDiscoveryData {
  token: string;
  policyId: string;
  assetName: string;
  totalPools: number;
  totalLiquidity: number;
  pools: {
    identifier: string;
    dex: string;
    tvl: number;
    isActive: boolean;
  }[];
  recommendedIdentifiers: string[];
}
