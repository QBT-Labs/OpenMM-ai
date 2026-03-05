export { plainAdapter } from "./plain.js";
export { cliAdapter } from "./cli.js";
export { telegramAdapter } from "./telegram.js";
export { discordAdapter, createDiscordEmbed, type DiscordEmbed } from "./discord.js";
export {
  slackAdapter,
  createSlackSection,
  createSlackFields,
  createSlackDivider,
  type SlackBlock,
} from "./slack.js";
export { whatsappAdapter } from "./whatsapp.js";
export { markdownAdapter } from "./markdown.js";