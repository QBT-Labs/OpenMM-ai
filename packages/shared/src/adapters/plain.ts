import type { FormatAdapter } from "../types.js";

export const plainAdapter: FormatAdapter = {
  bold: (text) => text,
  italic: (text) => text,
  code: (text) => text,
  codeBlock: (text) => text,
  link: (text, url) => `${text} (${url})`,
  header: (text) => `--- ${text} ---`,
  divider: () => "---",
  statusIcon: (status) => {
    const icons: Record<string, string> = {
      success: "[OK]",
      warning: "[WARN]",
      error: "[ERR]",
      info: "[INFO]",
    };
    return icons[status] ?? "[?]";
  },
  list: (items) => items.map((item) => `- ${item}`).join("\n"),
  keyValue: (key, value) => `${key}: ${value}`,
};
