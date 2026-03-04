import type { FormatAdapter, ErrorData } from "../types.js";

export function formatError(adapter: FormatAdapter, error: ErrorData): string {
  const lines = [
    `${adapter.statusIcon("error")} ${adapter.bold("Error")}`,
    adapter.keyValue("Message", error.message),
  ];
  if (error.code) {
    lines.push(adapter.keyValue("Code", adapter.code(error.code)));
  }
  if (error.details) {
    lines.push(adapter.keyValue("Details", error.details));
  }
  return lines.join("\n");
}