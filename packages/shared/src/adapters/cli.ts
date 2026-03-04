import type { FormatAdapter } from "../types.js";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  italic: "\x1b[3m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
} as const;

export const cliAdapter: FormatAdapter = {
  bold: (text) => `${ANSI.bold}${text}${ANSI.reset}`,
  italic: (text) => `${ANSI.italic}${text}${ANSI.reset}`,
  code: (text) => `${ANSI.cyan}${text}${ANSI.reset}`,
  codeBlock: (text) => `${ANSI.dim}${text}${ANSI.reset}`,
  link: (text, url) => `${text} ${ANSI.dim}(${url})${ANSI.reset}`,
  header: (text) => `${ANSI.bold}${text}${ANSI.reset}`,
  divider: () => `${ANSI.dim}${"─".repeat(40)}${ANSI.reset}`,
  statusIcon: (status) => {
    const icons: Record<string, string> = {
      success: `${ANSI.green}[OK]${ANSI.reset}`,
      warning: `${ANSI.yellow}[WARN]${ANSI.reset}`,
      error: `${ANSI.red}[ERR]${ANSI.reset}`,
      info: `${ANSI.blue}[INFO]${ANSI.reset}`,
    };
    return icons[status] ?? "[?]";
  },
  list: (items) => items.map((item) => `  ${ANSI.dim}•${ANSI.reset} ${item}`).join("\n"),
  keyValue: (key, value) => `  ${ANSI.bold}${key}:${ANSI.reset} ${value}`,
};
