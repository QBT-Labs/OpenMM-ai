import type { FormatAdapter } from "../types.js";

export const slackAdapter: FormatAdapter = {
  bold: (text) => `*${text}*`,
  italic: (text) => `_${text}_`,
  code: (text) => `\`${text}\``,
  codeBlock: (text) => `\`\`\`${text}\`\`\``,
  link: (text, url) => `<${url}|${text}>`,
  header: (text) => `*${text}*`,
  divider: () => "---",
  statusIcon: (status) => {
    const icons: Record<string, string> = {
      success: ":white_check_mark:",
      warning: ":warning:",
      error: ":red_circle:",
      info: ":information_source:",
    };
    return icons[status] ?? ":grey_question:";
  },
  list: (items) => items.map((item) => `• ${item}`).join("\n"),
  keyValue: (key, value) => `*${key}:* ${value}`,
};

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: Array<{ type: string; text: string }>;
}

export function createSlackSection(text: string): SlackBlock {
  return { type: "section", text: { type: "mrkdwn", text } };
}

export function createSlackFields(
  fields: Array<{ label: string; value: string }>,
): SlackBlock {
  return {
    type: "section",
    fields: fields.map((f) => ({
      type: "mrkdwn",
      text: `*${f.label}*\n${f.value}`,
    })),
  };
}

export function createSlackDivider(): SlackBlock {
  return { type: "divider" };
}