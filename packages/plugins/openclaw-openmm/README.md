# openclaw-openmm

> OpenClaw plugin for OpenMM — trade, monitor, and manage grid strategies from Telegram or any OpenClaw channel

[![npm](https://img.shields.io/npm/v/@qbtlabs/openclaw-openmm)](https://www.npmjs.com/package/@qbtlabs/openclaw-openmm)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../../LICENSE)

An [OpenClaw](https://docs.openclaw.ai) plugin that wraps [OpenMM](https://github.com/3rd-Eye-Labs/OpenMM) as agent tools and auto-reply commands. Manage your trading from Telegram, Discord, or any other OpenClaw channel.

---

## Setup

### Step 1: Install the OpenMM CLI

The plugin calls the OpenMM CLI under the hood. Install it globally:

```bash
npm install -g @3rd-eye-labs/openmm
```

Verify it works:

```bash
openmm --version
```

### Step 2: Install the plugin

```bash
openclaw plugins install @qbtlabs/openclaw-openmm
```

Then install the plugin's npm dependencies:

```bash
cd ~/.openclaw/extensions/openclaw-openmm && npm install && cd -
```

### Step 3: Add exchange credentials to OpenClaw config

Open your OpenClaw configuration file:

```bash
nano ~/.openclaw/openclaw.json
```

Find the `"plugins"` section and add an `"openmm"` entry with your exchange API credentials. Only include the exchanges you want to use:

```json
{
  "plugins": {
    "entries": {
      "openmm": {
        "enabled": true,
        "config": {
          "defaultExchange": "mexc",
          "mexcApiKey": "your_mexc_api_key",
          "mexcSecret": "your_mexc_secret"
        }
      }
    }
  }
}
```

**Full example with all four exchanges:**

```json
{
  "plugins": {
    "entries": {
      "openmm": {
        "enabled": true,
        "config": {
          "defaultExchange": "mexc",
          "mexcApiKey": "your_mexc_api_key",
          "mexcSecret": "your_mexc_secret",
          "gateioApiKey": "your_gateio_api_key",
          "gateioSecret": "your_gateio_secret",
          "krakenApiKey": "your_kraken_api_key",
          "krakenSecret": "your_kraken_secret",
          "bitgetApiKey": "your_bitget_api_key",
          "bitgetSecret": "your_bitget_secret",
          "bitgetPassphrase": "your_bitget_passphrase"
        }
      }
    }
  }
}
```

> **Note:** Merge this into your existing config — don't replace the whole file. Your `openclaw.json` will already have other sections like `"channels"`, `"agents"`, etc. Just add the `"openmm"` entry inside the existing `"plugins"."entries"` object.

### Step 4: Restart the gateway

If the gateway is already running, stop it first:

```bash
kill $(lsof -ti:18789) 2>/dev/null; sleep 2; openclaw gateway
```

Or if starting fresh:

```bash
openclaw gateway
```

You should see this line in the logs confirming the plugin loaded:

```
[plugins] [openmm] Strategy monitor ready. Active strategies will be tracked.
```

### Step 5: Test in Telegram

Send these messages to your OpenClaw bot:

```
/balance mexc
/price mexc BTC/USDT
/orders mexc
```

If you see balance data and prices, the plugin is working.

---

## Supported Exchanges

| Exchange | Config Keys | How to get API keys |
|----------|-------------|---------------------|
| MEXC | `mexcApiKey`, `mexcSecret` | [mexc.com/ucenter/api](https://www.mexc.com/ucenter/api) |
| Gate.io | `gateioApiKey`, `gateioSecret` | [gate.io/myaccount/apikeys](https://www.gate.io/myaccount/apikeys) |
| Kraken | `krakenApiKey`, `krakenSecret` | [kraken.com/u/security/api](https://www.kraken.com/u/security/api) |
| Bitget | `bitgetApiKey`, `bitgetSecret`, `bitgetPassphrase` | [bitget.com/account/newapi](https://www.bitget.com/account/newapi) |

When creating API keys on any exchange:
- **Enable** spot trading and read permissions
- **Disable** withdrawal permissions
- **Enable** IP whitelisting if available

---

## Troubleshooting

### "Command failed: openmm balance ..."

The OpenMM CLI isn't installed or not in the gateway's PATH. Run:

```bash
npm install -g @3rd-eye-labs/openmm
which openmm
```

### "Environment validation failed: MEXC_API_KEY is missing"

Exchange credentials aren't configured. Check your `~/.openclaw/openclaw.json` has the `"openmm"` plugin entry with credentials under `"config"`.

### Plugin not loading

Check that the plugin is installed:

```bash
ls ~/.openclaw/extensions/openclaw-openmm/
```

And that dependencies are installed:

```bash
cd ~/.openclaw/extensions/openclaw-openmm && npm install && cd -
```

### "Plugin command is invalid for Telegram"

Telegram only allows `a-z`, `0-9`, and `_` in command names. All commands in this plugin follow that rule. If you see this error for `/cancelall`, update to the latest version.

### Gateway port already in use

Another gateway instance is running. Kill it and restart:

```bash
kill $(lsof -ti:18789) 2>/dev/null; sleep 2; openclaw gateway
```

---

## Agent Tools

These tools are available to the LLM agent during conversation:

| Tool | Description | Side Effect |
|------|-------------|-------------|
| `openmm_balance` | Get exchange balances | No |
| `openmm_ticker` | Current price, bid/ask, volume | No |
| `openmm_orderbook` | Order book depth | No |
| `openmm_trades` | Recent trades | No |
| `openmm_list_orders` | List open orders | No |
| `openmm_grid_status` | Grid strategy status and P&L | No |
| `openmm_cardano_price` | Cardano token price from DEX pools | No |
| `openmm_discover_pools` | Discover Cardano DEX pools | No |
| `openmm_create_order` | Place a limit or market order | **Yes** (optional) |
| `openmm_cancel_order` | Cancel an order by ID | **Yes** (optional) |
| `openmm_cancel_all_orders` | Cancel all open orders | **Yes** (optional) |
| `openmm_grid_start` | Start a grid strategy (dry-run default) | **Yes** (optional) |
| `openmm_grid_stop` | Stop a running grid strategy | **Yes** (optional) |

Tools marked **optional** require explicit allowlisting in your agent config:

```json5
{
  agents: {
    list: [{
      tools: {
        allow: ["openmm_create_order", "openmm_cancel_order", "openmm_grid_start", "openmm_grid_stop"]
      }
    }]
  }
}
```

---

## Auto-Reply Commands

These commands execute immediately without invoking the AI agent:

| Command | Description | Example |
|---------|-------------|---------|
| `/balance [exchange]` | Quick balance check | `/balance mexc` |
| `/price <exchange> <symbol>` | Quick price check | `/price kraken ADA/EUR` |
| `/strategy <exchange> <symbol>` | Grid strategy status | `/strategy mexc SNEK/USDT` |
| `/orders [exchange]` | List open orders | `/orders bitget` |
| `/orderbook <exchange> <symbol>` | Order book (top 10) | `/orderbook mexc BTC/USDT` |
| `/pools <token>` | Discover Cardano DEX pools | `/pools SNEK` |
| `/cardano <token>` | Cardano token DEX price | `/cardano INDY` |
| `/cancelall <exchange> [symbol]` | Cancel all open orders (auth required) | `/cancelall mexc SNEK/USDT` |

---

## Background Service

The plugin registers a strategy monitor service that tracks active grid strategies. The service starts automatically when the plugin is enabled.

---

## Safety

- **Order creation and grid start are optional tools** — they require explicit allowlisting before the agent can use them
- **Grid strategies default to dry-run** — the `openmm_grid_start` tool simulates by default unless `dryRun: false` is passed
- **Never enable withdrawal permissions** on your exchange API keys — trading keys should only have trade and read access

---

## Links

- **OpenMM Core:** https://github.com/3rd-Eye-Labs/OpenMM
- **MCP Server:** https://github.com/QBT-Labs/OpenMM-MCP
- **OpenClaw Plugin Docs:** https://docs.openclaw.ai/tools/plugin
- **OpenClaw Agent Tools:** https://docs.openclaw.ai/plugins/agent-tools

## License

MIT
