import type { FormatAdapter } from "../types.js";

/**
 * Standard Markdown adapter. Works with any platform that has a
 * Markdown→IR pipeline (e.g. OpenClaw), which then renders to
 * Telegram HTML, Slack mrkdwn, Signal text+spans, etc.
 */
export const markdownAdapter: FormatAdapter = {
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  code: (text) => `\`${text}\``,
  codeBlock: (text) => `\`\`\`\n${text}\n\`\`\``,
  link: (text, url) => `[${text}](${url})`,
  header: (text) => `**${text}**`,
  divider: () => "---",
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
  keyValue: (key, value) => `**${key}:** ${value}`,
};