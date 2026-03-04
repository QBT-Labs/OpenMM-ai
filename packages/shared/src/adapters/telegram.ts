import type { FormatAdapter } from "../types.js";

export const telegramAdapter: FormatAdapter = {
  bold: (text) => `*${text}*`,
  italic: (text) => `_${text}_`,
  code: (text) => `\`${text}\``,
  codeBlock: (text) => `\`\`\`\n${text}\n\`\`\``,
  link: (text, url) => `[${text}](${url})`,
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
  list: (items) => items.map((item) => `│ ${item}`).join("\n"),
  keyValue: (key, value) => `│ *${key}:* ${value}`,
};
