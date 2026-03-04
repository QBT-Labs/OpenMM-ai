import type { FormatAdapter } from "../types.js";

export const discordAdapter: FormatAdapter = {
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  code: (text) => `\`${text}\``,
  codeBlock: (text) => `\`\`\`\n${text}\n\`\`\``,
  link: (text, url) => `[${text}](${url})`,
  header: (text, level = 1) => `${"#".repeat(level)} ${text}`,
  divider: () => "───",
  statusIcon: (status) => {
    const icons: Record<string, string> = {
      success: "🟢",
      warning: "🟡",
      error: "🔴",
      info: "🔵",
    };
    return icons[status] ?? "⚪";
  },
  list: (items) => items.map((item) => `• ${item}`).join("\n"),
  keyValue: (key, value) => `**${key}:** ${value}`,
};

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
}

const STATUS_COLORS = {
  success: 0x00ff00,
  warning: 0xffaa00,
  error: 0xff0000,
  info: 0x0099ff,
} as const;

export function createDiscordEmbed(
  title: string,
  description: string,
  status: keyof typeof STATUS_COLORS = "info",
  fields?: DiscordEmbed["fields"],
): DiscordEmbed {
  return {
    title,
    description,
    color: STATUS_COLORS[status],
    ...(fields && { fields }),
  };
}