# @qbtlabs/shared

Shared formatting utilities for OpenMM AI plugins. Provides platform-specific format adapters and domain formatters for consistent output across Telegram, Discord, Slack, WhatsApp, CLI, and plain text.

## Adapters

| Adapter | Platform | Description |
|---------|----------|-------------|
| `plainAdapter` | Plain text | No formatting, suitable for logs |
| `cliAdapter` | Terminal | ANSI color codes and box drawing |
| `telegramAdapter` | Telegram | Markdown V2 formatting |
| `discordAdapter` | Discord | Discord markdown with embeds |
| `slackAdapter` | Slack | Slack mrkdwn with Block Kit helpers |
| `whatsappAdapter` | WhatsApp | WhatsApp-compatible formatting |

## Formatters

| Formatter | Description |
|-----------|-------------|
| `formatBalance` / `formatBalanceCompact` | Exchange balance display |
| `formatTicker` | Price ticker with bid/ask spread |
| `formatOrderbook` | Order book with asks/bids |
| `formatOrders` | Open orders display |
| `formatTrades` | Recent trades |
| `formatError` | Error display with status icons |
| `formatNum` | Smart number formatting |

## Usage

```typescript
import { telegramAdapter, formatTicker } from "@qbtlabs/shared";

const output = formatTicker(telegramAdapter, {
  symbol: "BTC/USDT",
  exchange: "mexc",
  last: 64250.5,
  bid: 64248.0,
  ask: 64253.0,
  baseVolume: 1234.56,
});
```

## License

MIT — QBT Labs
