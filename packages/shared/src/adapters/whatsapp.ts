import type { FormatAdapter } from "../types.js";

export const whatsappAdapter: FormatAdapter = {
  bold: (text) => `*${text}*`,
  italic: (text) => `_${text}_`,
  code: (text) => `\`${text}\``,
  codeBlock: (text) => `\`\`\`${text}\`\`\``,
  link: (text, url) => `${text} (${url})`,
  header: (text) => `*${text}*`,
  divider: () => "─────────────────",
  statusIcon: (status) => {
    const icons: Record<string, string> = {
      success: "✅",
      warning: "⚠️",
      error: "🔴",
      info: "ℹ️",
    };
    return icons[status] ?? "❓";
  },
  list: (items) => items.map((item) => `• ${item}`).join("\n"),
  keyValue: (key, value) => `*${key}:* ${value}`,
};