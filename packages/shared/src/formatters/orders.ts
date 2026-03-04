import type { FormatAdapter, OrderData } from "../types.js";
import { formatNum } from "./num.js";

export function formatOrders(adapter: FormatAdapter, orders: OrderData[]): string {
  if (orders.length === 0) return "No open orders.";

  const lines = [adapter.header(`Open Orders (${orders.length})`), ""];

  for (const o of orders) {
    const side = o.side.toUpperCase();
    const filled = o.filled ? ` filled: ${formatNum(o.filled)}` : "";
    lines.push(
      adapter.keyValue(
        `${side} ${formatNum(o.amount)} ${o.symbol}`,
        `@ ${formatNum(o.price)}${filled}`,
      ),
    );
    lines.push(adapter.keyValue("ID", `${adapter.code(o.id)}  Status: ${o.status ?? "open"}`));
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}